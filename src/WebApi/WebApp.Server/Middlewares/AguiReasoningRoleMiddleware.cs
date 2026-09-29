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
                    && obj["messages"] is JsonArray messages
                    && Sanitize(messages) is var removedCount && removedCount > 0)
                {
                    _logger.LogInformation("AG-UI request sanitized. TraceId={TraceId}, RemovedReasoningMessages={RemovedCount}", traceId, removedCount);
                    var bytes = Encoding.UTF8.GetBytes(node.ToJsonString());
                    context.Request.Body = new MemoryStream(bytes);
                    context.Request.ContentLength = bytes.Length;
                    await InvokeWithEventTracing(context, traceId);
                    _logger.LogInformation("AG-UI request completed. TraceId={TraceId}, Path={Path}, StatusCode={StatusCode}", traceId, context.Request.Path, context.Response.StatusCode);
                    return;
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

    private static int Sanitize(JsonArray messages)
    {
        var removedCount = 0;
        for (var i = messages.Count - 1; i >= 0; i--)
        {
            if (messages[i] is JsonObject message
                && message["role"] is JsonValue role
                && role.TryGetValue<string>(out var roleName)
                && string.Equals(roleName, "reasoning", StringComparison.OrdinalIgnoreCase))
            {
                messages.RemoveAt(i);
                removedCount++;
            }
        }
        return removedCount;
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
