using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace WebApp.Server.Agent.RateLimit;

/// <summary>
/// Hạn mức chat agent: mỗi user tối đa DailyChatLimit câu mỗi ngày (mặc định 15).
/// Đếm bằng Redis INCR theo key agent:chat:quota:{userId}:{ngày} (ngày theo giờ Việt Nam UTC+7).
/// Redis lỗi thì cho qua (không chặn oan user) và ghi log cảnh báo.
/// </summary>
internal sealed record AgentChatQuotaResult(bool Allowed, int Limit, int Used, DateTimeOffset ResetsAt);

internal sealed class AgentChatDailyLimiter
{
    private readonly IConnectionMultiplexer _redis;
    private readonly ICurrentNguoiDungService _current;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AgentChatDailyLimiter> _logger;

    public AgentChatDailyLimiter(
        IConnectionMultiplexer redis,
        ICurrentNguoiDungService current,
        IConfiguration configuration,
        ILogger<AgentChatDailyLimiter> logger)
    {
        _redis = redis;
        _current = current;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<AgentChatQuotaResult> TryConsumeAsync(CancellationToken cancellationToken = default)
    {
        var limit = Math.Max(1, _configuration.GetValue("Agent:DailyChatLimit", 15));
        var resetsAt = NextResetUtc();

        int userId;
        try
        {
            userId = (await _current.ResolveAsync()).Id;
        }
        catch
        {
            // Chưa resolve được user (chưa đăng nhập...) → cho qua,
            // endpoint agent có RequireAuthorization sẽ tự trả 401/403 trước khi tốn LLM.
            return new AgentChatQuotaResult(true, limit, 0, resetsAt);
        }

        var day = DateTime.UtcNow.AddHours(7).ToString("yyyyMMdd"); // ngày theo giờ VN
        var key = $"agent:chat:quota:{userId}:{day}";

        try
        {
            var db = _redis.GetDatabase();
            var used = await db.StringIncrementAsync(key);
            if (used == 1)
            {
                // TTL dư 30h phòng lệch giờ, key tự hết dù không dọn.
                await db.KeyExpireAsync(key, TimeSpan.FromHours(30));
            }

            var allowed = used <= limit;
            if (!allowed)
            {
                _logger.LogWarning(
                    "User {UserId} đã hết hạn mức chat agent hôm nay ({Used}/{Limit}).",
                    userId, used, limit);
            }

            return new AgentChatQuotaResult(allowed, limit, (int)used, resetsAt);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Redis sập: vẫn cho chat để không chặn oan; log để kỹ thuật xử lý.
            _logger.LogWarning(ex, "Redis rate-limit lỗi, bỏ qua hạn mức lần này. UserId={UserId}", userId);
            return new AgentChatQuotaResult(true, limit, 0, resetsAt);
        }
    }

    private static DateTimeOffset NextResetUtc()
    {
        var nowVn = DateTime.UtcNow.AddHours(7);
        var nextMidnightVn = new DateTime(nowVn.Year, nowVn.Month, nowVn.Day).AddDays(1);
        return new DateTimeOffset(nextMidnightVn.AddHours(-7), TimeSpan.Zero);
    }
}
