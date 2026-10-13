using System.Text.Json;
using WebApp.Server.Agent.RateLimit;

namespace WebApp.Server.Middlewares;

/// <summary>
/// Hạn mức chat agent 15 câu/ngày (cấu hình Agent:DailyChatLimit).
/// Chỉ chặn đúng các request chat agent (POST /api/copilotkit dạng SSE AG-UI);
/// các request khác (GET info/threads, proxy API...) đi qua bình thường.
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
}
