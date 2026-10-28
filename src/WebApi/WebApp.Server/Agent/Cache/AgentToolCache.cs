using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Application.Interfaces;
using Application.Wrappers;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace WebApp.Server.Agent.Cache;

/// <summary>
/// Cache kết quả tool agent theo từng user trong Redis.
/// Key dạng agent:tool:{userId}:{toolName}:{hash(tham số)} — userId nằm trong key
/// nên tuyệt đối không trộn chéo giữa các user. Chỉ cache kết quả thành công;
/// Redis lỗi thì bỏ qua cache và chạy tool bình thường (không sập chat).
/// TTL lấy từ cấu hình Agent:ToolCacheSeconds (mặc định 120 giây).
/// </summary>
internal sealed class AgentToolCache
{
    // cấu hình JSON chuẩn web (camelCase, không phân biệt hoa thường, bỏ qua null, v.v.) để serialize/deserialize tham số và kết quả tool để tái sử dụng tối uu hiệu năng
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    // để đọc/ghi cache phân tán dung chung cho (redis/sql,..) lưu dữ liệu dạng byte[] đã tuần tự chuẩn hóa
    private readonly IDistributedCache _cache;
    private readonly ICurrentNguoiDungService _current;
    // đại diện cho tập hợp cấu hình ứng dụng dạng key/value(appsettings,.env,...) để đọc TTL cache
    private readonly IConfiguration _configuration;
    // ghi log
    private readonly ILogger<AgentToolCache> _logger;

    public AgentToolCache(
        IDistributedCache cache,
        ICurrentNguoiDungService current,
        IConfiguration configuration,
        ILogger<AgentToolCache> logger)
    {
        _cache = cache;
        _current = current;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Trả kết quả từ cache nếu có; nếu không thì chạy <paramref name="factory"/> rồi ghi cache.
    /// Không xác định được user → bỏ qua cache hoàn toàn (an toàn tuyệt đối).
    /// Kết quả không thành công (Response.Succeeded = false) → không ghi cache.
    /// </summary>
    public async Task<T> GetOrCreateAsync<T>(
        string toolName,
        object? args,
        Func<Task<T>> factory,
        CancellationToken cancellationToken)
    {
        string key;
        try
        {
            var userId = (await _current.ResolveAsync()).Id;
            key = BuildKey(userId, toolName, args);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Không xác định được user → không cache để không bao giờ trả dữ liệu nhầm người.
            _logger.LogDebug(ex, "Agent tool cache bỏ qua vì không resolve được user. Tool={Tool}", toolName);
            return await factory();
        }

        try
        {
            var hit = await _cache.GetStringAsync(key, cancellationToken);
            if (hit != null)
            {
                var cached = JsonSerializer.Deserialize<T>(hit, JsonOptions);
                if (cached != null)
                {
                    _logger.LogDebug("Agent tool cache HIT. Key={Key}", key);
                    return cached;
                }
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "Agent tool cache đọc lỗi, chạy lại tool. Key={Key}", key);
        }

        var result = await factory();

        // Chỉ cache khi không phải Response<T> báo lỗi (Succeeded = false).
        if (!IsFailedResponse(result))
        {
            try
            {
                var ttlSeconds = Math.Max(5, _configuration.GetValue("Agent:ToolCacheSeconds", 120));
                await _cache.SetStringAsync(
                    key,
                    JsonSerializer.Serialize(result, JsonOptions),
                    new DistributedCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(ttlSeconds)
                    },
                    cancellationToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(ex, "Agent tool cache ghi lỗi. Key={Key}", key);
            }
        }

        return result;
    }

    // Response<T> là generic nên không so được với Response trần.
    // Dùng reflection để biết T có phải Response<T> đang báo lỗi không — chỉ chạy trên cache-miss nên không mất gì.
    private static bool IsFailedResponse(object? result)
    {
        if (result is null) return false;

        var type = result.GetType();

        // 1. Truong hop ;a generic Response<T> chuan cua he thong
        if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(Response<>))
        {
            return type.GetProperty(nameof(Response<object>.Succeeded))?.GetValue(result) is false;
        }

        // 2. Truong hop la cac DTO ket qua tuy bien (nhu ProfileToolResult) co thuoc tinh Succeeded
        var succeededProp = type.GetProperty("Succeeded");
        if (succeededProp != null &&
            succeededProp.PropertyType == typeof(bool) &&
            succeededProp.CanRead)
        {
            return succeededProp.GetValue(result) is false;
        }

        return false;
    }

    private static string BuildKey(int userId, string toolName, object? args)
    {
        var argsJson = args == null ? "-" : JsonSerializer.Serialize(args, JsonOptions);
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(argsJson)))[..16];
        return $"agent:tool:{userId}:{toolName}:{hash}";
    }
}
