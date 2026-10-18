using System.Text.Json;
using System.Text.Json.Nodes;
using WebApp.Server.Agent.RateLimit;

namespace WebApp.Server.Middlewares;

/// <summary>
/// Hạn mức chat agent 15 lượt/ngày (cấu hình Agent:DailyChatLimit).
/// Chỉ chặn đúng các request chat agent (POST /api/copilotkit dạng SSE AG-UI);
/// các request khác (GET info/threads, proxy API...) đi qua bình thường.
/// Chỉ tính 1 lượt cho MỘT câu hỏi của người dùng: run tiếp nối sau khi
/// frontend tool đã chạy (messages kết thúc bằng role=tool) không trừ quota.
/// Hết hạn mức → trả 429 kèm thông báo tiếng Việt.
/// </summary>
internal sealed class AgentChatRateLimitMiddleware : IMiddleware
{
    private readonly AgentChatDailyLimiter _limiter;
    private readonly ILogger<AgentChatRateLimitMiddleware> _logger;

    public AgentChatRateLimitMiddleware(
        AgentChatDailyLimiter limiter,
        ILogger<AgentChatRateLimitMiddleware> logger)
    {
        _limiter = limiter;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        if (!IsAgentChatRun(context))
        {
            await next(context);
            return;
        }

        // Run TIẾP NỐI sau khi frontend tool đã chạy (messages kết thúc bằng
        // role=tool) chỉ là phần còn lại của CÙNG một lượt chat người dùng đã
        // trừ quota ở run đầu. Không trừ lần nữa — trước đây mỗi resume cũng
        // bị INCR nên một câu hỏi (nhiều tool call) ăn cả chục lượt/ngày.
        if (await IsToolResultResumeAsync(context))
        {
            await next(context);
            return;
        }

        var quota = await _limiter.TryConsumeAsync(context.RequestAborted);
        if (quota.Allowed)
        {
            context.Response.Headers["X-Agent-Quota-Remaining"] =
                Math.Max(0, quota.Limit - quota.Used).ToString();
            await next(context);
            return;
        }

        var retryAfter = Math.Max(1, (int)(quota.ResetsAt - DateTimeOffset.UtcNow).TotalSeconds);
        context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.Response.Headers.RetryAfter = retryAfter.ToString();
        context.Response.ContentType = "application/json; charset=utf-8";
        await context.Response.WriteAsync(JsonSerializer.Serialize(new
        {
            message = $"Bạn đã dùng hết {quota.Limit} lượt chat Adam hôm nay. Vui lòng quay lại sau.",
            used = quota.Used,
            limit = quota.Limit,
            resetsAt = quota.ResetsAt
        }), context.RequestAborted);
    }

    private static bool IsAgentChatRun(HttpContext context)
        => HttpMethods.IsPost(context.Request.Method)
           && context.Request.Path.StartsWithSegments("/api/copilotkit")
           && ((context.Request.Headers.Accept.ToString()
                    .Contains("text/event-stream", StringComparison.OrdinalIgnoreCase))
               || (context.Request.ContentType?
                    .Contains("text/event-stream", StringComparison.OrdinalIgnoreCase) == true));

    /// <summary>
    /// Run này là TIẾP NỐI (frontend tool đã trả kết quả) hay lượt chat MỚI
    /// của người dùng? Resume khi message CUỐI CÙNG trong body có role=tool.
    /// Chỉ đọc body JSON (không làm thay đổi vị trí cho middleware sau).
    /// </summary>
    private async Task<bool> IsToolResultResumeAsync(HttpContext context)
    {
        if (context.Request.ContentType?
                .Contains("application/json", StringComparison.OrdinalIgnoreCase) != true)
            return false;

        try
        {
            // Middleware trên đã buffer/reset sẵn; chỉ buffer thêm khi stream
            // chưa seek được (tránh bọc MemoryStream đã bị ghi đè → file tạm).
            if (!context.Request.Body.CanSeek) context.Request.EnableBuffering();
            if (context.Request.Body.CanSeek) context.Request.Body.Position = 0;

            using var document = await JsonDocument.ParseAsync(
                context.Request.Body, cancellationToken: context.RequestAborted);

            if (document.RootElement.TryGetProperty("messages", out var messages)
                && messages.ValueKind == JsonValueKind.Array
                && messages.GetArrayLength() > 0
                && messages[messages.GetArrayLength() - 1] is { ValueKind: JsonValueKind.Object } last
                && last.TryGetProperty("role", out var role)
                && role.ValueKind == JsonValueKind.String
                && string.Equals(role.GetString(), "tool", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Không đọc được body → coi là lượt mới (vẫn trừ quota), không chặn oan.
            _logger.LogDebug(ex, "Rate-limit không kiểm tra được body; tính là lượt chat mới.");
        }
        finally
        {
            try
            {
                if (context.Request.Body.CanSeek) context.Request.Body.Position = 0;
            }
            catch
            {
                // Stream có thể đã đóng khi client ngắt — bỏ qua.
            }
        }

        return false;
    }
}
