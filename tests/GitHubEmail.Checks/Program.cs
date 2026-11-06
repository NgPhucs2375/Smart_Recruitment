using System.Reflection;
using Infrastructure.Identity.Services;

var checks = 0;
void Check(bool condition, string name)
{
    if (!condition) throw new Exception($"FAIL {name}");
    checks++;
    Console.WriteLine($"PASS {name}");
}

// AccountService.FetchGitHubProfileAsync không còn được lùi về email công khai trên hồ sơ
// GitHub (GitHub không đảm bảo người giữ token control hộp thư đó), nên quyết định
// "email nào được tin" gom hết vào PickVerifiedGitHubEmail — test trực tiếp hàm đó.
var pick = typeof(AccountService).GetMethod(
    "PickVerifiedGitHubEmail", BindingFlags.NonPublic | BindingFlags.Static);
Check(pick != null, "PickVerifiedGitHubEmail tồn tại làm seam cho quyết định tin email");
if (pick is null) return;

string? Pick(string json) => (string?)pick!.Invoke(null, new object[] { json });
Exception? PickThrown(string json)
{
    try { Pick(json); return null; }
    catch (TargetInvocationException tie) { return tie.InnerException; }
}

const string UnverifiedOnly = """
    [{"email":"hatuo@gmail.com","verified":false,"primary":true}]
    """;
const string PrimaryLast = """
    [{"email":"phu@alt.vn","verified":true,"primary":false},
     {"email":"Phuc.Gmail@Gmail.com","verified":true,"primary":true}]
    """;
const string VerifiedNonPrimary = """
    [{"email":"no@x.vn","verified":false,"primary":true},
     {"email":"alt@x.vn","verified":true,"primary":false},
     {"email":"second@x.vn","verified":true,"primary":false}]
    """;

Check(Pick(UnverifiedOnly) == null,
    "email chưa verified bị loại — đây chính là đường chiếm tài khoản qua GitHub");
Check(Pick(PrimaryLast) == "phuc.gmail@gmail.com",
    "chọn email verified primary, chuẩn hoá trim + lowercase");
Check(Pick(VerifiedNonPrimary) == "alt@x.vn",
    "không có primary verified thì lấy email verified đầu tiên");
Check(Pick("""[{"email":"   ","verified":true,"primary":true}]""") == null,
    "verified nhưng email rỗng → không tin");
Check(Pick("[]") == null, "GitHub trả danh sách rỗng → không tin");
var broken = PickThrown("{not json}");
Check(broken is System.Text.Json.JsonException,
    $"payload hỏng → khước ngay (JsonException), không suy đoán email — actual: {broken?.GetType().Name ?? "không lỗi"}");
var wrongType = PickThrown("""[{"email":"a@b.vn","verified":"true","primary":true}]""");
Check(wrongType is InvalidOperationException,
    $"verified sai kiểu (chuỗi \"true\") → khước, không tự coi là đã xác minh — actual: {wrongType?.GetType().Name ?? "không lỗi"}");
var notArray = PickThrown("""{"email":"a@b.vn"}""");
Check(notArray is InvalidOperationException,
    $"payload không phải mảng → khước — actual: {notArray?.GetType().Name ?? "không lỗi"}");

// HTTP failure path: FetchVerifiedGitHubEmailAsync bắt mọi exception → null, và
// FetchGitHubProfileAsync đổi null thành ApiException (không còn ?? profileEmail).
var fetch = typeof(AccountService).GetMethod(
    "FetchVerifiedGitHubEmailAsync", BindingFlags.NonPublic | BindingFlags.Instance);
Check(fetch != null, "FetchVerifiedGitHubEmailAsync là chỗ duy nhất cung cấp email cho GitHub login");

Console.WriteLine($"\n{checks} checks passed.");
