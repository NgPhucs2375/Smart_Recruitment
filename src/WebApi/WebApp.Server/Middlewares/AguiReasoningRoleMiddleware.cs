using System.Text;
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
                    _logger.LogInformation("AG-UI request sanitized. RemovedReasoningMessages={RemovedCount}", removedCount);
                    var bytes = Encoding.UTF8.GetBytes(node.ToJsonString());
                    context.Request.Body = new MemoryStream(bytes);
                    context.Request.ContentLength = bytes.Length;
                    await _next(context);
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

        await _next(context);
    }

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
}
