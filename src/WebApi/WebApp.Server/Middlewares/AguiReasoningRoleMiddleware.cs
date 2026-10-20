using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace WebApp.Server.Middlewares;

// MapAGUIServer (MAF preview) ném "Unknown chat role: reasoning" khi history
// gửi kèm message role=reasoning: client @ag-ui lưu REASONING events thành
// message rồi gửi lại ở continuation run sau tool result. Middleware này
// LOẠI message reasoning khỏi history trước khi request tới AG-UI endpoint:
// thinking không cần cho lượt tiếp theo (tool call/result vẫn giữ nguyên),
// vừa tránh 500 vừa chống phình history (đã thấy 30+ msgs/run khiến mỗi
// lượt chậm thêm). Chỉ áp cho POST JSON /api/copilotkit.
public sealed class AguiReasoningRoleMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<AguiReasoningRoleMiddleware> _logger;

    public AguiReasoningRoleMiddleware(
        RequestDelegate next,
        ILogger<AguiReasoningRoleMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(HttpContext context)
    {
        var isAguiRequest = HttpMethods.IsPost(context.Request.Method)
            && context.Request.Path.StartsWithSegments("/api/copilotkit");
        var traceId = context.Request.Headers["X-AGUI-Trace-Id"].FirstOrDefault()
            ?? context.TraceIdentifier;
        if (isAguiRequest)
        {
            context.Response.Headers["X-AGUI-Trace-Id"] = traceId;
            _logger.LogInformation(
                "AG-UI request received. TraceId={TraceId}, Path={Path}, ContentType={ContentType}, HasAuthorization={HasAuthorization}",
                traceId,
                context.Request.Path,
                context.Request.ContentType,
                context.Request.Headers.Authorization.Count > 0);
        }

        if (HttpMethods.IsPost(context.Request.Method)
            && context.Request.Path.StartsWithSegments("/api/copilotkit")
            && context.Request.ContentType?.Contains(
                "application/json", StringComparison.OrdinalIgnoreCase) == true)
        {
            context.Request.EnableBuffering();
            try
            {
                var node = await JsonNode.ParseAsync(context.Request.Body);
                if (node is JsonObject obj
                    && obj["messages"] is JsonArray messages)
                {
                    _logger.LogInformation(
                        "AG-UI request messages. TraceId={TraceId}, Count={Count}, Pattern={Pattern}",
                        traceId, messages.Count, DescribePattern(messages));
                    var removedCount = Sanitize(messages);
                    removedCount += RepairOrphanToolTurns(messages, traceId);
                    var fixedArgs = SanitizeToolCallArguments(messages, traceId);
                    if (removedCount > 0 || fixedArgs > 0)
                    {
                        _logger.LogInformation("AG-UI request sanitized. TraceId={TraceId}, RemovedCount={RemovedCount}, FixedToolCallArgs={FixedArgs}", traceId, removedCount, fixedArgs);
                        _logger.LogInformation("AG-UI request messages after sanitize. TraceId={TraceId}, Count={Count}, Pattern={Pattern}", traceId, messages.Count, DescribePattern(messages));
                        var bytes = Encoding.UTF8.GetBytes(node.ToJsonString());
                        context.Request.Body = new MemoryStream(bytes);
                        context.Request.ContentLength = bytes.Length;
                        await InvokeWithEventTracing(context, traceId);
                        _logger.LogInformation("AG-UI request completed. TraceId={TraceId}, Path={Path}, StatusCode={StatusCode}", traceId, context.Request.Path, context.Response.StatusCode);
                        return;
                    }
                }
            }
            catch (Exception ex)
            {
                // Body không phải JSON hợp lệ: để pipeline dưới quyết định.
                _logger.LogWarning(ex, "AG-UI request body could not be inspected.");
            }
            context.Request.Body.Position = 0;
        }

        await InvokeWithEventTracing(context, traceId);
        if (isAguiRequest)
        {
            _logger.LogInformation("AG-UI request completed. TraceId={TraceId}, Path={Path}, StatusCode={StatusCode}", traceId, context.Request.Path, context.Response.StatusCode);
        }
    }

    private async Task InvokeWithEventTracing(HttpContext context, string traceId)
    {
        var isAguiRequest = HttpMethods.IsPost(context.Request.Method)
            && context.Request.Path.StartsWithSegments("/api/copilotkit");
        if (!isAguiRequest)
        {
            await _next(context);
            return;
        }

        var originalBody = context.Response.Body;
        var eventIndex = 0;
        await using var tracingBody = new SseTracingStream(originalBody, line =>
        {
            if (!line.StartsWith("data:", StringComparison.Ordinal)) return;
            var payload = line[5..].TrimStart();
            if (!payload.StartsWith('{'))
            {
                _logger.LogWarning("AG-UI SSE malformed event. TraceId={TraceId}, EventIndex={EventIndex}, Payload={Payload}", traceId, ++eventIndex, Truncate(payload));
                return;
            }

            try
            {
                using var document = JsonDocument.Parse(payload);
                var root = document.RootElement;
                var type = GetString(root, "type");
                var runId = GetString(root, "runId");
                var threadId = GetString(root, "threadId");
                var toolCallId = GetString(root, "toolCallId");
                var toolName = GetString(root, "toolName") ?? GetString(root, "name");
                _logger.LogInformation(
                    "AG-UI SSE event. TraceId={TraceId}, EventIndex={EventIndex}, Type={Type}, RunId={RunId}, ThreadId={ThreadId}, ToolCallId={ToolCallId}, ToolName={ToolName}, Payload={Payload}",
                    traceId, ++eventIndex, type, runId, threadId, toolCallId, toolName, Truncate(payload));
            }
            catch (JsonException)
            {
                _logger.LogWarning("AG-UI SSE invalid JSON. TraceId={TraceId}, EventIndex={EventIndex}, Payload={Payload}", traceId, ++eventIndex, Truncate(payload));
            }
        });

        context.Response.Body = tracingBody;
        try
        {
            await _next(context);
        }
        finally
        {
            context.Response.Body = originalBody;
        }
    }

    private static string? GetString(JsonElement element, string propertyName) =>
        element.TryGetProperty(propertyName, out var property) && property.ValueKind == JsonValueKind.String
            ? property.GetString()
            : null;

    private static string Truncate(string value) => value.Length <= 2_000 ? value : value[..2_000] + "...";

    /// <summary>
    /// Chuẩn hoá history AG-UI trước khi gửi MAF (Gemini), CHỈ xóa thứ gây
    /// 500; KHÔNG phá context tool.
    ///
    /// Quan trọng (nguyên nhân loop): bản trước xóa sạch mọi message role=tool
    /// và mọi toolCalls của assistant. Với AllowMultipleToolCalls=false, mỗi
    /// frontend tool là 1 HTTP run riêng; request kế tiếp lịch sử bị lọc về
    /// đúng [user] → model không thấy tool nào đã chạy → re-plan lại toàn bộ
    /// flow → tool → resume → loop vô tận tới 429. Giữ cặp toolCall↔result
    /// là bắt buộc để model tiếp tục chứ không làm lại.
    ///
    /// Các bước:
    /// 1. Bỏ message role=reasoning (MAF ném "Unknown chat role: reasoning" → 500).
    /// 2. Gộp các message assistant LIỀN TIẾP thành1 turn. Nếu tách lẻ thì
    ///    assistant(toolCall) đứng ngay sau assistant(text) → Gemini400
    ///    "function call turn comes immediately after a user turn or after a
    ///    function response turn". Gộp → turn text+functionCall sau user/turn
    ///    tool là hợp lệ.
    /// 3. Cắt turn đầu không phải user (model không được nói trước user).
    /// (4. Vá cặp call↔result mồ côi do RepairOrphanToolTurns.)
    /// </summary>
    private int Sanitize(JsonArray messages)
    {
        var removedCount = 0;

        for (var i = messages.Count - 1; i >= 0; i--)
        {
            if (messages[i] is JsonObject message && RoleOf(message) == "reasoning")
            {
                messages.RemoveAt(i);
                removedCount++;
            }
        }

        removedCount += MergeConsecutiveAssistant(messages);
        removedCount += TrimLeadingNonUser(messages);
        return removedCount;
    }

    private static int MergeConsecutiveAssistant(JsonArray messages)
    {
        var mergedCount = 0;
        var output = new JsonArray();
        foreach (var node in messages)
        {
            if (node is not JsonObject message
                || RoleOf(message) != "assistant"
                || output.Count == 0
                || output[output.Count - 1] is not JsonObject prev
                || RoleOf(prev) != "assistant")
            {
                if (node != null) output.Add(node.DeepClone());
                continue;
            }

            output.RemoveAt(output.Count - 1);
            output.Add(MergeAssistant(prev, message));
            mergedCount++;
        }

        if (mergedCount == 0) return 0;
        ReplaceAll(messages, output);
        return mergedCount;
    }

    private static JsonObject MergeAssistant(JsonObject first, JsonObject second)
    {
        var merged = new JsonObject { ["role"] = "assistant" };
        if (first["id"] is JsonValue id && id.TryGetValue<string>(out var firstId) && !string.IsNullOrWhiteSpace(firstId))
            merged["id"] = firstId;
        else if (second["id"] is JsonValue id2 && id2.TryGetValue<string>(out var secondId) && !string.IsNullOrWhiteSpace(secondId))
            merged["id"] = secondId;
        else
            merged["id"] = Guid.NewGuid().ToString("n");

        var text = (GetText(first) + "\n" + GetText(second)).Trim();
        if (text.Length > 0) merged["content"] = text;

        var calls = new JsonArray();
        foreach (var call in GetCalls(first)) calls.Add(call?.DeepClone());
        foreach (var call in GetCalls(second)) calls.Add(call?.DeepClone());
        if (calls.Count > 0) merged["toolCalls"] = calls;

        return merged;
    }

    private static int TrimLeadingNonUser(JsonArray messages)
    {
        var removed = 0;
        while (messages.Count > 0
               && messages[0] is JsonObject first
               && RoleOf(first) != "user")
        {
            messages.RemoveAt(0);
            removed++;
        }
        return removed;
    }

    private static string RoleOf(JsonObject message)
        => message["role"] is JsonValue role && role.TryGetValue<string>(out var name)
            ? name.ToLowerInvariant()
            : "";

    private static string GetText(JsonObject message)
        => message["content"] switch
        {
            JsonValue v when v.TryGetValue<string>(out var s) => s ?? "",
            JsonArray parts => string.Concat(parts.OfType<JsonValue>()
                .Select(part => part.TryGetValue<string>(out var text) ? text : "")),
            _ => "",
        };

    private static JsonArray GetCalls(JsonObject message)
        => message["toolCalls"] is JsonArray calls
            ? calls
            : message["tool_calls"] is JsonArray legacy
                ? legacy
                : new JsonArray();

    private static HashSet<string> GetCallIds(JsonObject message)
    {
        var ids = new HashSet<string>(StringComparer.Ordinal);
        foreach (var call in GetCalls(message))
        {
            if (call is JsonObject obj
                && obj["id"] is JsonValue idValue
                && idValue.TryGetValue<string>(out var id)
                && !string.IsNullOrWhiteSpace(id))
                ids.Add(id);
        }
        return ids;
    }

    private static string? GetToolCallId(JsonObject message)
        => message["toolCallId"] is JsonValue value
           && value.TryGetValue<string>(out var id)
           && !string.IsNullOrWhiteSpace(id)
            ? id
            : null;

    private static void ReplaceAll(JsonArray target, JsonArray source)
    {
        for (var i = target.Count - 1; i >= 0; i--) target.RemoveAt(i);
        // JsonNode chỉ có 1 parent: phải detach khỏi source trước khi add sang
        // target, nếu không Add ném "The node already has a parent".
        while (source.Count > 0)
        {
            var node = source[0];
            source.RemoveAt(0);
            target.Add(node);
        }
    }

    private static bool IsEmptyContent(JsonNode? content) => content switch
    {
        null => true,
        JsonValue v when v.TryGetValue<string>(out var s) => string.IsNullOrWhiteSpace(s),
        JsonArray a => a.Count == 0,
        _ => false,
    };

    private static bool HasToolCalls(JsonObject message)
        => message["toolCalls"] is JsonArray calls && calls.Count > 0;

    // "user,assistant(calls=n),tool,..." — mỗi message 1 token, cắt ở 80 token
    // để log không phình. Dùng để chẩn đoán chính xác pattern Gemini đang từ chối.
    private static string DescribePattern(JsonArray messages)
    {
        var sb = new StringBuilder();
        var count = Math.Min(messages.Count, 80);
        for (var i = 0; i < count; i++)
        {
            if (i > 0) sb.Append(',');
            if (messages[i] is not JsonObject message)
            {
                sb.Append('?');
                continue;
            }
            var role = message["role"] is JsonValue r && r.TryGetValue<string>(out var roleName)
                ? roleName
                : "?";
            if (role == "assistant" && HasToolCalls(message))
            {
                var calls = ((JsonArray)message["toolCalls"]!).Count;
                var hasText = !IsEmptyContent(message["content"]);
                sb.Append(hasText ? $"assistant(text+{calls}calls)" : $"assistant({calls}calls)");
            }
            else
            {
                sb.Append(role);
            }
        }
        if (messages.Count > count) sb.Append(",...");
        return sb.ToString();
    }

    // History thực tế (Redis + client) có thể chứa cặp call↔result lệch:
    // - assistant gọi frontend tool (VD navigateToCvEditor) nhưng
    //   TOOL_CALL_RESULT mất do navigation unmount giữa chừng → call mồ côi;
    // - tool result không còn call phía trước (orphan);
    // - assistant(toolCall) đứng ngay sau assistant(text) → Gemini 400
    //   "function call turn comes immediately after a user turn or after a
    //   function response turn".
    //
    // Vá theo từng pair SAU khi Sanitize đã gộp assistant liền kề và cắt
    // leading non-user. Duyệt 1 lần, dựng lại mảng kết quả:
    // - assistant có call: thu nhận dải tool result LIỀN SAU đúng id; call
    //   thiếu result → gỡ riêng call đó (giữ text của message).
    // - tool result không bám vào assistant call ngay trước → bỏ (orphan).
    // - assistant (không call) mà rỗng → bỏ (turn rỗng cũng khiến Gemini 400).
    // Trả về số chỗ sửa để cộng vào removedCount (kích hoạt rewrite body).
    private int RepairOrphanToolTurns(JsonArray messages, string traceId)
    {
        var output = new JsonArray();
        var fixedCount = 0;
        var i = 0;

        while (i < messages.Count)
        {
            if (messages[i] is not JsonObject message)
            {
                i++;
                continue;
            }

            var role = RoleOf(message);

            if (role == "assistant")
            {
                // Turn đầu là model → Gemini không cho. (Sanitize đã cắt nhưng
                // giữ lại đây cho chắc, phòng khi bị/opt thứ tự khác đi.)
                if (output.Count == 0)
                {
                    fixedCount++;
                    i++;
                    continue;
                }

                var callIds = GetCallIds(message);
                if (callIds.Count == 0)
                {
                    // Assistant thuần text: bỏ hẳn nếu trống (turn rỗng = 400).
                    if (IsEmptyContent(message["content"]))
                    {
                        fixedCount++;
                    }
                    else
                    {
                        output.Add(message.DeepClone());
                    }
                    i++;
                    continue;
                }

                // Thu nhận dải TOOL_CALL_RESULT LIỀN NGAY sau turn này.
                var j = i + 1;
                var results = new List<JsonObject>();
                var matched = new HashSet<string>(StringComparer.Ordinal);
                while (j < messages.Count
                       && messages[j] is JsonObject next
                       && RoleOf(next) == "tool"
                       && GetToolCallId(next) is { } resultId
                       && callIds.Contains(resultId)
                       && !matched.Contains(resultId))
                {
                    matched.Add(resultId);
                    results.Add((JsonObject)next.DeepClone());
                    j++;
                }

                var keptCalls = new JsonArray();
                foreach (var call in GetCalls(message))
                {
                    if (call is JsonObject callObj
                        && callObj["id"] is JsonValue callIdValue
                        && callIdValue.TryGetValue<string>(out var callId)
                        && matched.Contains(callId))
                        keptCalls.Add(callObj.DeepClone());
                }

                var rebuilt = (JsonObject)message.DeepClone();
                rebuilt.Remove("toolCalls");
                rebuilt.Remove("tool_calls");

                if (keptCalls.Count > 0)
                {
                    rebuilt["toolCalls"] = keptCalls;
                    output.Add(rebuilt);
                    foreach (var result in results) output.Add(result);
                }
                else
                {
                    // Toàn bộ call mồ côi: giữ text (nếu có) để không mất
                    // nội dung đã trả lời, chỉ bỏ phần call hỏng.
                    fixedCount++;
                    if (!IsEmptyContent(message["content"]))
                        output.Add(rebuilt);
                }

                i = j;
                continue;
            }

            if (role == "tool")
            {
                var resultId = GetToolCallId(message);
                var prev = output.Count > 0 ? output[output.Count - 1] as JsonObject : null;
                if (resultId is null
                    || prev is null
                    || RoleOf(prev) != "assistant"
                    || !GetCallIds(prev).Contains(resultId))
                {
                    // Tool result mồ côi (không có call ngay trước) → bỏ.
                    fixedCount++;
                }
                else
                {
                    output.Add(message.DeepClone());
                }
                i++;
                continue;
            }

            // user (hoặc role lạ khác MAF hiểu) → giữ nguyên.
            output.Add(message.DeepClone());
            i++;
        }

        ReplaceAll(messages, output);

        if (fixedCount > 0)
            _logger.LogWarning(
                "AG-UI history vá cặp call↔result mồ côi. TraceId={TraceId}, FixedTurns={FixedCount}",
                traceId, fixedCount);
        return fixedCount;
    }

    // Client cộng dồn TOOL_CALL_ARGS deltas (arguments += delta). Khi stream
    // lỗi (delta trùng/cumulative), arguments thành 2 JSON dính nhau
    // ("{...}{...}") và MapAGUIServer nổ JsonException 500
    // ("'{' is invalid after a single JSON value..."). Sửa ở đây vì middleware
    // này đã buffer + rewrite body: validate từng arguments, cắt lấy document
    // JSON hoàn chỉnh đầu tiên, không sửa được thì thay "{}". Fail-open hoàn
    // toàn: không bao giờ ném, chỉ log warning để lần sau truy vết.
    private int SanitizeToolCallArguments(JsonArray messages, string traceId)
    {
        var fixedCount = 0;
        foreach (var message in messages)
        {
            if (message is not JsonObject messageObj
                || messageObj["toolCalls"] is not JsonArray toolCalls)
                continue;
            foreach (var toolCall in toolCalls)
            {
                if (toolCall is not JsonObject toolCallObj
                    || toolCallObj["function"] is not JsonObject function
                    || GetArgumentsNode(function) is not { } argsNode)
                    continue;
                var raw = argsNode.GetValue<string>();
                if (string.IsNullOrWhiteSpace(raw))
                    continue;
                if (AguiJsonRepair.IsSingleJsonDocument(raw))
                    continue;
                var repaired = AguiJsonRepair.ExtractFirstJsonDocument(raw) ?? "{}";
                SetArgumentsNode(function, repaired);
                fixedCount++;
                _logger.LogWarning(
                    "AG-UI toolCall arguments hỏng đã được sửa. TraceId={TraceId}, ToolCallId={ToolCallId}, ToolName={ToolName}, RawLength={RawLength}, RepairedLength={RepairedLength}, Preview={Preview}",
                    traceId,
                    GetStringOrNull(toolCallObj, "id"),
                    GetStringOrNull(function, "name"),
                    raw.Length,
                    repaired.Length,
                    raw.Length <= 300 ? raw : raw[..300]);
            }
        }
        return fixedCount;
    }

    private static string? GetStringOrNull(JsonObject obj, string name)
        => obj[name] is JsonValue value && value.TryGetValue<string>(out var s) ? s : null;

    private static JsonValue? GetArgumentsNode(JsonObject function)
    {
        if (function["arguments"] is JsonValue args && args.TryGetValue<string>(out _))
            return args;
        if (function["args"] is JsonValue legacy && legacy.TryGetValue<string>(out _))
            return legacy;
        return null;
    }

    private static void SetArgumentsNode(JsonObject function, string value)
    {
        if (function["arguments"] is JsonValue)
            function["arguments"] = value;
        else if (function["args"] is JsonValue)
            function["args"] = value;
    }

    private sealed class SseTracingStream : Stream
    {
        private readonly Stream _inner;
        private readonly Action<string> _onLine;
        private readonly StringBuilder _buffer = new();

        public SseTracingStream(Stream inner, Action<string> onLine)
        {
            _inner = inner;
            _onLine = onLine;
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
        public override void SetLength(long value) => _inner.SetLength(value);

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
            _buffer.Append(Encoding.UTF8.GetString(bytes));
            while (true)
            {
                var newline = _buffer.ToString().IndexOf('\n');
                if (newline < 0) return;
                var line = _buffer.ToString(0, newline).TrimEnd('\r');
                _buffer.Remove(0, newline + 1);
                _onLine(line);
            }
        }
    }
}
