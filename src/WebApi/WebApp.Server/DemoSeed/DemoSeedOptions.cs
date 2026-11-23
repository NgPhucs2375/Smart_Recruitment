namespace WebApp.Server.DemoSeed;

/// <summary>
/// Tham số dòng lệnh của chế độ nạp dữ liệu demo một lần (chạy bằng
/// <c>dotnet WebApp.Server.dll --seed-demo --apply</c>, không mở web host):
/// <list type="bullet">
/// <item><c>--seed-demo</c> bật chế độ; mặc định chỉ in kế hoạch, không ghi DB.</item>
/// <item><c>--apply</c> thực sự ghi dữ liệu (idempotent theo khoá tự nhiên).</item>
/// <item><c>--clean</c> xoá dữ liệu demo (tài khoản @demo.local + tin/biên tập của bộ nội dung).</item>
/// </list>
/// </summary>
public sealed record DemoSeedOptions(bool Requested, bool Apply, bool Clean)
{
    public static DemoSeedOptions Parse(string[] args)
    {
        static bool Has(string[] values, string flag) =>
            values.Any(x => string.Equals(x, flag, StringComparison.OrdinalIgnoreCase));

        return new DemoSeedOptions(
            Has(args, "--seed-demo"),
            Has(args, "--apply"),
            Has(args, "--clean"));
    }
}
