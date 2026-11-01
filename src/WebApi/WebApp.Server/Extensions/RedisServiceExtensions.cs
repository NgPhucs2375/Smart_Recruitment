using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;
using WebApp.Server.Health;

namespace WebApp.Server.Extensions;

public static class RedisServiceExtensions
{
    public static IServiceCollection AddRedisInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Redis");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "ConnectionStrings:Redis chưa được cấu hình.");
        }

        var redis = ConnectionMultiplexer.Connect(connectionString);
        services.AddSingleton<IConnectionMultiplexer>(redis);

        services.AddStackExchangeRedisCache(options =>
        {
            options.ConnectionMultiplexerFactory = () =>
                Task.FromResult<IConnectionMultiplexer>(redis);
        });

        // Link đặt lại mật khẩu / xác minh email là token DataProtection: mất key ring là
        // mất toàn bộ link đang chờ trong mailbox người dùng. Key ring mặc định lưu trong
        // container (ephemeral) => mọi lần restart backend đều vô hiệu hóa chúng.
        services.AddDataProtection()
            .SetApplicationName("RecruitmentSmart")
            .PersistKeysToStackExchangeRedis(redis, "recruitmentsmart:dataprotection-keys");

        services
            .AddHealthChecks()
            .AddCheck<RedisHealthCheck>("redis", tags: ["ready"]);

        return services;
    }
}
