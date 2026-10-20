using System.Diagnostics;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Configuration;
using WebApp.Server.Agent.Threads;

namespace WebApp.Server.Middlewares;

/// <summary>
/// Persist lịch sử chat agent Adam theo threadId vào Redis (AgentThreadStore).
/// Chỉ intercept POST /api/copilotkit dạng run (JSON body có threadId/runId):
/// - Đọc body (buffered) lấy threadId, runId, agentId, messages → rewind body.
/// - Tee response SSE, gom các dòng `data:` thành danh sách AG-UI event.
/// - Sau khi run kết thúc: merge input+output messages, lưu snapshot + run record.
/// Fail-open hoàn toàn: mọi lỗi (Redis, parse...) chỉ log warning, không chặn chat.
/// </summary>
internal sealed class AgentThreadHistoryMiddleware : IMiddleware
{
    private static readonly HashSet<string> EssentialEventTypes = new(StringComparer.Ordinal)
    {
        "RUN_STARTED", "RUN_FINISHED", "RUN_ERROR",
        "TEXT_MESSAGE_START", "TEXT_MESSAGE_CONTENT", "TEXT_MESSAGE_END",
        "TOOL_CALL_START", "TOOL_CALL_ARGS", "TOOL_CALL_END", "TOOL_CALL_RESULT",
        "STATE_SNAPSHOT", "MESSAGES_SNAPSHOT"
    };

    private readonly AgentThreadStore _store;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AgentThreadHistoryMiddleware> _logger;

    public AgentThreadHistoryMiddleware(
        AgentThreadStore store,
        IConfiguration configuration,
        ILogger<AgentThreadHistoryMiddleware> logger)
    {
        _store = store;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        if (!IsAgentRunRequest(context))
        {
            await next(context);
            return;
        }

        string? threadId = null;
        string? runId = null;
        string? agentId = null;
        var inputMessages = new List<JsonNode>();

        try
        {
            context.Request.EnableBuffering();
            var node = await JsonNode.ParseAsync(context.Request.Body);
            if (context.Request.Body.CanSeek) context.Request.Body.Position = 0;

            if (node is JsonObject obj)
            {
                threadId = GetString(obj, "threadId");
                runId = GetString(obj, "runId");
                agentId = GetString(obj, "agentId");
                if (obj["messages"] is JsonArray messages)
                {
                    foreach (var message in messages)
                    {
                        if (message != null) inputMessages.Add(message.DeepClone());
                    }
                }
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "Agent thread history: không đọc được body, bỏ qua persist.");
            if (context.Request.Body.CanSeek) context.Request.Body.Position = 0;
        }

        if (!AgentThreadStore.IsValidThreadId(threadId))
        {
            await next(context);
            return;
        }

        var originalBody = context.Response.Body;
        var capture = new SseCaptureStream(originalBody);
        context.Response.Body = capture;
        var stopwatch = Stopwatch.StartNew();
        try
        {
            await next(context);
        }
        finally
        {
            context.Response.Body = originalBody;
            stopwatch.Stop();
            await TryPersistAsync(context, threadId!, runId, agentId, inputMessages, capture, stopwatch.Elapsed);
        }
    }

    private async Task TryPersistAsync(
        HttpContext context,
        string threadId,
        string? runId,
        string? agentId,
        List<JsonNode> inputMessages,
        SseCaptureStream capture,
        TimeSpan duration)
    {
        try
        {
            // Chỉ persist khi run thực sự stream SSE (429/500 JSON thì bỏ qua).
            if (context.Response.StatusCode != StatusCodes.Status200OK
                || context.Response.ContentType?.Contains("text/event-stream", StringComparison.OrdinalIgnoreCase) != true)
            {
                return;
            }

            var userId = await _store.CurrentUserIdAsync();
            if (userId is null) return;

            var events = ParseEvents(capture.CapturedLines);
            if (events.Count == 0) return;

            var capped = CapEvents(events, Math.Clamp(
                _configuration.GetValue("Agent:ThreadMaxEvents", 800),
                50, 5000));

            var outputMessages = AssembleMessages(capped);
            var status = DeriveStatus(capped);
            var effectiveRunId = runId ?? FindStringField(capped, "RUN_STARTED", "runId") ?? Guid.NewGuid().ToString("n");

            await _store.SaveAsync(userId.Value, new AgentThreadSaveData
            {
                ThreadId = threadId,
                RunId = effectiveRunId,
                AgentId = agentId ?? FindStringField(capped, "RUN_STARTED", "agentId"),
                Status = status,
                InputMessageCount = inputMessages.Count,
                Events = capped,
                InputMessages = inputMessages,
                OutputMessages = outputMessages
            });
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "Agent thread history persist lỗi, bỏ qua. ThreadId={ThreadId}, DurationMs={DurationMs}",
                threadId, (long)duration.TotalMilliseconds);
        }
    }

    private static bool IsAgentRunRequest(HttpContext context)
        => HttpMethods.IsPost(context.Request.Method)
           && context.Request.Path.StartsWithSegments("/api/copilotkit")
           && context.Request.ContentType?.Contains("application/json", StringComparison.OrdinalIgnoreCase) == true;

    private static string? GetString(JsonObject obj, string name)
        => obj[name] is JsonValue value && value.TryGetValue<string>(out var s) ? s : null;

    private static string? GetArgsDelta(JsonObject obj)
        => GetString(obj, "delta") ?? GetString(obj, "args");

    private static List<JsonNode> ParseEvents(IReadOnlyList<string> capturedLines)
    {
        var events = new List<JsonNode>();
        foreach (var line in capturedLines)
        {
            if (!line.StartsWith("data:", StringComparison.Ordinal)) continue;
            var payload = line[5..].TrimStart();
            if (!payload.StartsWith('{')) continue;
            try
            {
                var node = JsonNode.Parse(payload);
                if (node != null) events.Add(node);
            }
            catch (JsonException)
            {
                // Dangling chunk — bỏ qua.
            }
        }
        return events;
    }

    /// <summary>
    /// Overflow guard cho event của MỘT run (middleware capture từng run riêng):
    /// 1) Quá lớn → lọc về essential types.
    /// 2) Vẫn quá → cắt giữa nhưng luôn giữ bookend hợp lệ (RUN_STARTED đầu,
    ///    RUN_FINISHED/RUN_ERROR cuối) và cắt ở ranh giới message/tool-call
    ///    để client replay không gặp CONTENT/ARGS mồ côi; chèn 1 message
    ///    START/CONTENT/END đánh dấu đã cắt.
    /// </summary>
    private static List<JsonNode> CapEvents(List<JsonNode> events, int max)
    {
        if (events.Count <= max) return events;

        var essential = events
            .Where(e => e is JsonObject obj
                && obj["type"] is JsonValue typeValue
                && typeValue.TryGetValue<string>(out var t)
                && EssentialEventTypes.Contains(t))
            .ToList();
        if (essential.Count <= max) return essential;

        // Budget: bookends (2) + truncation notice (3) leaves the rest for the tail.
        var noticeBudget = 3;
        var bookendBudget = 2;
        var tailBudget = Math.Max(1, max - noticeBudget - bookendBudget);

        var head = new List<JsonNode>();
        var first = essential.FirstOrDefault();
        if (first != null) head.Add(first); // RUN_STARTED (đầu run hợp lệ)

        var tail = new List<JsonNode>();
        var last = essential.LastOrDefault();
        var lastType = last is JsonObject lastObj ? lastObj["type"]?.GetValue<string>() : null;
        var hasBookend = lastType is "RUN_FINISHED" or "RUN_ERROR";

        // Quay ngược thu thập tailBudget event, nhưng bắt đầu ở ranh giới an toàn.
        var boundaryTypes = new HashSet<string>(StringComparer.Ordinal)
        {
            "RUN_STARTED", "TEXT_MESSAGE_START", "TOOL_CALL_START", "TOOL_CALL_RESULT",
            "STATE_SNAPSHOT", "MESSAGES_SNAPSHOT"
        };
        var collect = new List<JsonNode>();
        for (var i = essential.Count - 1; i >= 0 && collect.Count < tailBudget; i--)
        {
            var e = essential[i];
            collect.Add(e);
            if (i > 0 && collect.Count == tailBudget
                && e is JsonObject obj
                && obj["type"] is JsonValue tv
                && tv.TryGetValue<string>(out var currentType)
                && !boundaryTypes.Contains(currentType))
            {
                // Vừa đủ budget nhưng đầu chunk nằm giữa chừng → cắt bớt về ranh giới.
                collect.RemoveAt(collect.Count - 1);
            }
        }
        collect.Reverse();
        // Bỏ RUN_STARTED lọt đầu tail (đã có ở head) để verifyEvents không
        // thấy "RUN_STARTED while run still active".
        if (collect.Count > 0
            && collect[0] is JsonObject headObj
            && headObj["type"]?.GetValue<string>() == "RUN_STARTED")
        {
            collect.RemoveAt(0);
        }
        tail.AddRange(collect);
        if (hasBookend && last != null) tail.Add(last);

        var truncated = head
            .Concat(new[]
            {
                new JsonObject { ["type"] = "TEXT_MESSAGE_START", ["messageId"] = "truncated-notice" },
                new JsonObject { ["type"] = "TEXT_MESSAGE_CONTENT", ["messageId"] = "truncated-notice", ["content"] = "[Phần giữa của lượt chat này bị cắt để tiết kiệm bộ nhớ.]" },
                new JsonObject { ["type"] = "TEXT_MESSAGE_END", ["messageId"] = "truncated-notice" }
            })
            .Concat(tail)
            .ToList();
        return truncated;
    }

    /// <summary>
    /// Gom AG-UI streaming events thành messages (assistant + tool) —
    /// dùng làm output messages cho snapshot. Không bao gồm input (client đã gửi).
    /// </summary>
    private static List<JsonNode> AssembleMessages(IReadOnlyList<JsonNode> events)
    {
        var messages = new List<JsonNode>();
        var currentText = new StringBuilder();
        string? currentTextMessageId = null;
        var currentToolCalls = new JsonArray();
        var pendingArgs = new Dictionary<string, StringBuilder>(StringComparer.Ordinal);
        var pendingToolNames = new Dictionary<string, string?>(StringComparer.Ordinal);
        string? currentToolCallId = null;

        void FlushText()
        {
            var hasText = currentText.Length > 0;
            var hasCalls = currentToolCalls.Count > 0;
            // Không text mở mà cũng không có toolCalls chờ → không có gì để flush
            // (tránh lặp lại message trước đó).
            if (currentTextMessageId == null && !hasCalls) return;
            var messageId = currentTextMessageId ?? Guid.NewGuid().ToString("n");
            var text = currentText.ToString();
            var calls = currentToolCalls;
            currentTextMessageId = null;
            currentText.Clear();
            currentToolCalls = new JsonArray();
            // Turn assistant hoàn toàn rỗng (không text, không toolCalls):
            // validator strict của Gemini từ chối cả request
            // ("function call turn comes immediately..."), nên bỏ hẳn.
            if (!hasText && !hasCalls) return;
            var message = new JsonObject
            {
                ["id"] = messageId,
                ["role"] = "assistant",
            };
            // Content rỗng kèm toolCalls (VD model chỉ gọi tool không nói gì)
            // thì bỏ field content: giữ "" cũng bị strict validator soi.
            if (hasText) message["content"] = text;
            if (hasCalls) message["toolCalls"] = calls.DeepClone();
            messages.Add(message);
        }

        foreach (var e in events)
        {
            if (e is not JsonObject obj) continue;
            var type = obj["type"]?.GetValue<string>();
            switch (type)
            {
                case "TEXT_MESSAGE_START":
                    FlushText();
                    currentTextMessageId = obj["messageId"]?.GetValue<string>() ?? Guid.NewGuid().ToString("n");
                    currentToolCalls = new JsonArray();
                    break;

                case "TEXT_MESSAGE_CONTENT":
                    if (obj["content"] is JsonValue content && content.TryGetValue<string>(out var text))
                        currentText.Append(text);
                    break;

                case "TOOL_CALL_START":
                    currentToolCallId = obj["toolCallId"]?.GetValue<string>() ?? Guid.NewGuid().ToString("n");
                    pendingToolNames[currentToolCallId] =
                        obj["toolCallName"]?.GetValue<string>() ?? obj["name"]?.GetValue<string>();
                    pendingArgs[currentToolCallId] = new StringBuilder();
                    break;

                case "TOOL_CALL_ARGS":
                    // AG-UI TOOL_CALL_ARGS mang fragment ở field "delta"
                    // (spec chính thức); giữ "args" làm fallback cho bản preview cũ.
                    if (currentToolCallId != null
                        && GetArgsDelta(obj) is { } argsText)
                    {
                        pendingArgs[currentToolCallId].Append(argsText);
                    }
                    break;

                case "TOOL_CALL_END":
                    if (currentToolCallId != null)
                    {
                        // Không bao giờ persist arguments hỏng ("{doc1}{doc2}")
                        // vào Redis: history hỏng sẽ replay lại ở mọi run sau
                        // và làm MapAGUIServer nổ JsonException 500 vĩnh viễn.
                        var rawArgs = pendingArgs.GetValueOrDefault(currentToolCallId)?.ToString();
                        currentToolCalls.Add(new JsonObject
                        {
                            ["id"] = currentToolCallId,
                            ["type"] = "function",
                            ["function"] = new JsonObject
                            {
                                ["name"] = pendingToolNames.GetValueOrDefault(currentToolCallId) ?? "",
                                ["arguments"] = AguiJsonRepair.NormalizeArguments(rawArgs)
                            }
                        });
                        pendingArgs.Remove(currentToolCallId);
                        pendingToolNames.Remove(currentToolCallId);
                        currentToolCallId = null;
                    }
                    break;

                case "TOOL_CALL_RESULT":
                    FlushText();
                    var toolCallId = obj["toolCallId"]?.GetValue<string>() ?? Guid.NewGuid().ToString("n");
                    var resultContent = obj["content"] is JsonValue rc && rc.TryGetValue<string>(out var rcText)
                        ? rcText
                        : obj["content"]?.ToJsonString() ?? "";
                    messages.Add(new JsonObject
                    {
                        ["id"] = $"{toolCallId}-result",
                        ["role"] = "tool",
                        ["toolCallId"] = toolCallId,
                        ["content"] = resultContent
                    });
                    break;

                case "TEXT_MESSAGE_END":
                    FlushText();
                    break;
            }
        }

        FlushText();
        return messages;
    }

    private static string DeriveStatus(IReadOnlyList<JsonNode> events)
    {
        foreach (var e in events)
        {
            if (e is JsonObject obj && obj["type"]?.GetValue<string>() == "RUN_ERROR") return "error";
        }
        foreach (var e in events)
        {
            if (e is JsonObject obj && obj["type"]?.GetValue<string>() == "RUN_FINISHED") return "ok";
        }
        return "partial";
    }

    private static string? FindStringField(IReadOnlyList<JsonNode> events, string type, string field)
    {
        foreach (var e in events)
        {
            if (e is not JsonObject obj) continue;
            if (obj["type"]?.GetValue<string>() != type) continue;
            return obj[field] is JsonValue v && v.TryGetValue<string>(out var s) ? s : null;
        }
        return null;
    }

    /// <summary>
    /// Stream ghi-qua (tee): vừa forward byte xuống client, vừa gom dòng `data:`
    /// để persist. Bắt chước pattern của AguiReasoningRoleMiddleware.
    /// </summary>
    private sealed class SseCaptureStream : Stream
    {
        private readonly Stream _inner;
        private readonly StringBuilder _buffer = new();
        private readonly List<string> _captured = new();
        private readonly object _lock = new();

        public SseCaptureStream(Stream inner)
        {
            _inner = inner;
        }

        public IReadOnlyList<string> CapturedLines
        {
            get
            {
                lock (_lock) return _captured.ToList();
            }
        }

        public override bool CanRead => _inner.CanRead;
        public override bool CanSeek => false;
        public override bool CanWrite => _inner.CanWrite;
        public override long Length => _inner.Length;
        public override long Position { get => _inner.Position; set => throw new NotSupportedException(); }
        public override void Flush() => _inner.Flush();
        public override Task FlushAsync(CancellationToken cancellationToken) => _inner.FlushAsync(cancellationToken);
        public override int Read(byte[] buffer, int offset, int count) => _inner.Read(buffer, offset, count);
        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
        public override void SetLength(long value) => throw new NotSupportedException();

        public override void Write(byte[] buffer, int offset, int count)
        {
            Capture(buffer.AsSpan(offset, count));
            _inner.Write(buffer, offset, count);
        }

        public override void Write(ReadOnlySpan<byte> buffer)
        {
            Capture(buffer);
            _inner.Write(buffer);
        }

        public override async Task WriteAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken)
        {
            Capture(buffer.AsSpan(offset, count));
            await _inner.WriteAsync(buffer, offset, count, cancellationToken);
        }

        public override async ValueTask WriteAsync(ReadOnlyMemory<byte> buffer, CancellationToken cancellationToken = default)
        {
            Capture(buffer.Span);
            await _inner.WriteAsync(buffer, cancellationToken);
        }

        private void Capture(ReadOnlySpan<byte> bytes)
        {
            lock (_lock)
            {
                _buffer.Append(Encoding.UTF8.GetString(bytes));
                while (true)
                {
                    var text = _buffer.ToString();
                    var newline = text.IndexOf('\n');
                    if (newline < 0) return;
                    var line = text[..newline].TrimEnd('\r');
                    _buffer.Remove(0, newline + 1);
                    if (line.StartsWith("data:", StringComparison.Ordinal)) _captured.Add(line);
                }
            }
        }
    }
}
