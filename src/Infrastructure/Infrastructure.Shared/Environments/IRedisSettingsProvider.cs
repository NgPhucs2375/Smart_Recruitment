using StackExchange.Redis.Extensions.Core.Configuration;

namespace Infrastructure.Shared.Environments
{
    public interface IRedisSettingsProvider
    {
        RedisConfiguration GetRedisConfiguration();
    }
}
