using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;

namespace Application.Features.KetQuaPhuHop.Cache;

public static class RecommendationCache
{
    public const string JobsVersionKey = "cache:recommendations:jobs:v1:version";
    public const string CandidatePoolVersionKey = "cache:recommendations:candidates:v1:version";
    public static readonly TimeSpan Ttl = TimeSpan.FromMinutes(5);

    public static string JobRecommendationsKey(int userId, int cvId, string cvVersion, string jobsVersion, int topN) =>
        $"cache:recommendations:jobs:v1:user:{userId}:cv:{cvId}:cv-version:{cvVersion}:jobs-version:{jobsVersion}:top:{topN}";

    public static string CandidateRecommendationsKey(
        int companyId,
        int jobId,
        string jobVersion,
        string candidateVersion,
        int topN) =>
        $"cache:recommendations:candidates:v1:company:{companyId}:job:{jobId}:job-version:{jobVersion}:candidate-version:{candidateVersion}:top:{topN}";

    public static async Task<string> GetVersionAsync(
        IDistributedCache cache,
        string key,
        CancellationToken cancellationToken)
    {
        return await cache.GetStringAsync(key, cancellationToken) ?? "initial";
    }

    public static async Task<T?> GetAsync<T>(
        IDistributedCache cache,
        string key,
        CancellationToken cancellationToken)
    {
        var value = await cache.GetStringAsync(key, cancellationToken);
        return string.IsNullOrWhiteSpace(value)
            ? default
            : JsonSerializer.Deserialize<T>(value);
    }

    public static Task SetAsync<T>(
        IDistributedCache cache,
        string key,
        T value,
        CancellationToken cancellationToken) =>
        cache.SetStringAsync(
            key,
            JsonSerializer.Serialize(value),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = Ttl },
            cancellationToken);

    public static Task InvalidateJobsAsync(
        IDistributedCache cache,
        CancellationToken cancellationToken) =>
        SetVersionAsync(cache, JobsVersionKey, cancellationToken);

    public static Task InvalidateCandidatePoolAsync(
        IDistributedCache cache,
        CancellationToken cancellationToken) =>
        SetVersionAsync(cache, CandidatePoolVersionKey, cancellationToken);

    private static Task SetVersionAsync(
        IDistributedCache cache,
        string key,
        CancellationToken cancellationToken) =>
        cache.SetStringAsync(key, Guid.NewGuid().ToString("N"), cancellationToken);
}
