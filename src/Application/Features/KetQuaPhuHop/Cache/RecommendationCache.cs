#nullable enable

using System.Text.Json;
using Application.Features.KetQuaPhuHop.Matching;
using Microsoft.Extensions.Caching.Distributed;

namespace Application.Features.KetQuaPhuHop.Cache;

public static class RecommendationCache
{
    public const string JobsVersionKey = "cache:recommendations:jobs:v1:version";
    public const string CandidatePoolVersionKey = "cache:recommendations:candidates:v1:version";
    public static readonly TimeSpan Ttl = TimeSpan.FromMinutes(5);

    public static string JobRecommendationsKey(int userId, int cvId, string cvVersion, string jobsVersion, int topN) =>
        $"cache:recommendations:jobs:{ContentBasedMatcher.Version}:user:{userId}:cv:{cvId}:cv-version:{cvVersion}:jobs-version:{jobsVersion}:top:{topN}";

    public static string CandidateRecommendationsKey(
        int companyId,
        int jobId,
        string jobVersion,
        string candidateVersion,
        int topN) =>
        $"cache:recommendations:candidates:{ContentBasedMatcher.Version}:company:{companyId}:job:{jobId}:job-version:{jobVersion}:candidate-version:{candidateVersion}:top:{topN}";

    public static async Task<string> GetVersionAsync(
        IDistributedCache cache,
        string key,
        CancellationToken cancellationToken)
    {
        try
        {
            return await cache.GetStringAsync(key, cancellationToken) ?? "initial";
        }
        catch (Exception)
        {
            // Redis chứa key cùng tên nhưng khác kiểu (ví dụ đặt tay bằng
            // redis-cli SET). Xoá để lần ghi sau tạo lại đúng định dạng hash.
            await TryRemoveAsync(cache, key, cancellationToken);
            return "initial";
        }
    }

    public static async Task<T?> GetAsync<T>(
        IDistributedCache cache,
        string key,
        CancellationToken cancellationToken)
    {
        string? value;
        try
        {
            value = await cache.GetStringAsync(key, cancellationToken);
        }
        catch (Exception)
        {
            await TryRemoveAsync(cache, key, cancellationToken);
            return default;
        }

        if (string.IsNullOrWhiteSpace(value))
            return default;
        try
        {
            return JsonSerializer.Deserialize<T>(value);
        }
        catch (JsonException)
        {
            // Cache hỏng: coi như miss để query lại từ DB thay vì nổ 500.
            return default;
        }
    }

    public static async Task SetAsync<T>(
        IDistributedCache cache,
        string key,
        T value,
        CancellationToken cancellationToken)
    {
        var payload = JsonSerializer.Serialize(value);
        var options = new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = Ttl };
        try
        {
            await cache.SetStringAsync(key, payload, options, cancellationToken);
        }
        catch (Exception)
        {
            await TryRemoveAsync(cache, key, cancellationToken);
            try
            {
                await cache.SetStringAsync(key, payload, options, cancellationToken);
            }
            catch (Exception)
            {
                // Cache là best-effort: lỗi Redis không được làm hỏng request.
            }
        }
    }

    public static Task InvalidateJobsAsync(
        IDistributedCache cache,
        CancellationToken cancellationToken) =>
        SetVersionAsync(cache, JobsVersionKey, cancellationToken);

    public static Task InvalidateCandidatePoolAsync(
        IDistributedCache cache,
        CancellationToken cancellationToken) =>
        SetVersionAsync(cache, CandidatePoolVersionKey, cancellationToken);

    private static async Task SetVersionAsync(
        IDistributedCache cache,
        string key,
        CancellationToken cancellationToken)
    {
        var value = Guid.NewGuid().ToString("N");
        try
        {
            await cache.SetStringAsync(key, value, cancellationToken);
        }
        catch (Exception)
        {
            await TryRemoveAsync(cache, key, cancellationToken);
            try
            {
                await cache.SetStringAsync(key, value, cancellationToken);
            }
            catch (Exception)
            {
                // Cache là best-effort: bỏ qua lỗi Redis.
            }
        }
    }

    private static async Task TryRemoveAsync(
        IDistributedCache cache,
        string key,
        CancellationToken cancellationToken)
    {
        try
        {
            await cache.RemoveAsync(key, cancellationToken);
        }
        catch (Exception)
        {
            // Không xoá được thì thôi; lần đọc sau vẫn trả cache-miss an toàn.
        }
    }
}
