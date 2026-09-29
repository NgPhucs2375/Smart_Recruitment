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

        services
            .AddHealthChecks()
            .AddCheck<RedisHealthCheck>("redis", tags: ["ready"]);

        return services;
    }
}
