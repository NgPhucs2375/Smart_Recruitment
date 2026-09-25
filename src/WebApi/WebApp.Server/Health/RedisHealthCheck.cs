using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;

namespace WebApp.Server.Health;

public sealed class RedisHealthCheck(
    IConnectionMultiplexer redis
) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await redis.GetDatabase().PingAsync();
            return HealthCheckResult.Healthy("Redis is reachable.");
        }
        catch (Exception exception)
        {
            return HealthCheckResult.Unhealthy(
                "Redis is unavailable.",
                exception);
        }
    }
}
