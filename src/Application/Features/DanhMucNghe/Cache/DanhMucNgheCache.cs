namespace Application.Features.DanhMucNghe.Cache
{
    public static class DanhMucNgheCache
    {
        public const string VersionKey = "cache:danhmucnghe:v1:version";
        public static string BuildKey(
            string version,
            int start,
            int end,
            string filter
        )
        {
            var normalizedFilter = Uri.EscapeDataString(
                (filter ?? string.Empty).Trim().ToLowerInvariant()
            );

            return $"cache:danhmucnghe:v1:{version}:start:{start}:end:{end}:filter:{normalizedFilter}";
        }
    }
}
