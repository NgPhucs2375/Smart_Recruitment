namespace Application.Features.KyNang.Cache;

public static class KyNangCache
{
    public const string VersionKey = "cache:kynang:v1:version";

    public static string BuildKey(
        string version,
        int start,
        int end,
        string filter,
        string sort,
        string order)
    {
        static string Normalize(string value) =>
            Uri.EscapeDataString((value ?? string.Empty).Trim().ToLowerInvariant());

        return $"cache:kynang:v1:{version}:start:{start}:end:{end}:filter:{Normalize(filter)}:sort:{Normalize(sort)}:order:{Normalize(order)}";
    }
}
