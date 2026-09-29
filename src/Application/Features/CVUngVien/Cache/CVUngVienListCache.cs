using Microsoft.Extensions.Caching.Distributed;

namespace Application.Features.CVUngVien.Cache;

public static class CVUngVienListCache
{
    public static string DetailVersionKey(int cvId) =>
        $"cache:cv:detail:v1:cv:{cvId}:version";

    public static string BuildDetailKey(int userId, int cvId, string version) =>
        $"cache:cv:detail:v1:user:{userId}:cv:{cvId}:{version}";

    public static string VersionKey(int userId) =>
        $"cache:cv:list:v1:user:{userId}:version";

    public static string BuildKey(
        int userId,
        string version,
        int start,
        int end,
        string filter,
        string sort,
        string order)
    {
        static string Normalize(string value) =>
            Uri.EscapeDataString((value ?? string.Empty).Trim());

        return $"cache:cv:list:v1:user:{userId}:{version}:start:{start}:end:{end}:filter:{Normalize(filter)}:sort:{Normalize(sort)}:order:{Normalize(order)}";
    }

    public static Task InvalidateAsync(
        IDistributedCache cache,
        int userId,
        CancellationToken cancellationToken,
        params int[] cvIds)
    {
        var tasks = new List<Task>
        {
            cache.SetStringAsync(
                VersionKey(userId),
                Guid.NewGuid().ToString("N"),
                cancellationToken)
        };

        foreach (var cvId in cvIds.Distinct())
        {
            tasks.Add(cache.SetStringAsync(
                DetailVersionKey(cvId),
                Guid.NewGuid().ToString("N"),
                cancellationToken));
        }

        return Task.WhenAll(tasks);
    }
}
