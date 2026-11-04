using Infrastructure.Identity;
using Infrastructure.Identity.Helpers;
using Infrastructure.Identity.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

var checks = 0;
void Check(bool condition, string name)
{
    if (!condition) throw new Exception(name);
    checks++;
    Console.WriteLine($"PASS {name}");
}

// Không cần PostgreSQL: key JWT ở đây chỉ giả nhưng phải đủ điều kiện khởi tạo
// (Base64 giải mã được >= 32 byte) để nạp đúng phần khai báo Identity của app.
var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
{
    ["JWTSettings:Key"] = Convert.ToBase64String(new byte[32]),
    ["JWTSettings:Issuer"] = "Identity",
    ["JWTSettings:Audience"] = "IdentityUser",
}).Build();

var services = new ServiceCollection();
// PasswordValidator.ValidateAsync cần một UserManager thật, nên phải nạp store
// in-memory trước khi AddIdentityRepositories gọi AddEntityFrameworkStores.
services.AddInMemoryDatabase();
services.AddIdentityRepositories(configuration);
using var provider = services.BuildServiceProvider();

var identityOptions = provider.GetRequiredService<IOptions<IdentityOptions>>();
var options = identityOptions.Value;

Check(options.Password.RequiredLength == 6, "Policy giữ nguyên tối thiểu 6 ký tự (không âm thầm nâng lên 8)");
Check(options.Password.RequireDigit && options.Password.RequireLowercase
      && options.Password.RequireUppercase && options.Password.RequireNonAlphanumeric,
      "Policy khai báo tường minh: số + hoa + thường + ký tự đặc biệt");
Check(options.Password.RequiredUniqueChars == 1, "Policy yêu cầu 1 ký tự khác nhau");
Check(options.Lockout.AllowedForNewUsers
      && options.Lockout.MaxFailedAccessAttempts == 5
      && options.Lockout.DefaultLockoutTimeSpan == TimeSpan.FromMinutes(5),
      "Lockout tường minh: 5 lần sai / khóa 5 phút, áp dụng cho tài khoản mới");

var lifetimes = provider.GetRequiredService<IOptionsMonitor<DataProtectionTokenProviderOptions>>();
Check(options.Tokens.PasswordResetTokenProvider == "password-reset", "Đặt lại mật khẩu dùng token provider riêng");
Check(lifetimes.Get(options.Tokens.PasswordResetTokenProvider).TokenLifespan == TimeSpan.FromMinutes(30),
      "Link đặt lại mật khẩu hết hạn sau 30 phút");
Check(options.Tokens.EmailConfirmationTokenProvider == TokenOptions.DefaultProvider, "Xác minh email giữ provider Default");
Check(lifetimes.Get(TokenOptions.DefaultProvider).TokenLifespan == TimeSpan.FromHours(24),
      "Link xác minh email sống 24 giờ");

string Map(string code) => IdentityErrorMessages.Map(
    new[] { new IdentityError { Code = code, Description = "English framework description." } },
    "FALLBACK",
    identityOptions);

var policyCodes = new[]
{
    nameof(IdentityErrorDescriber.PasswordTooShort),
    nameof(IdentityErrorDescriber.PasswordRequiresUpper),
    nameof(IdentityErrorDescriber.PasswordRequiresLower),
    nameof(IdentityErrorDescriber.PasswordRequiresDigit),
    nameof(IdentityErrorDescriber.PasswordRequiresNonAlphanumeric),
    nameof(IdentityErrorDescriber.PasswordRequiresUniqueChars),
};
foreach (var code in policyCodes)
    Check(Map(code) is { Length: > 0 } message && !message.Contains("English"), $"Mapper dịch mã {code}");
Check(Map(nameof(IdentityErrorDescriber.PasswordTooShort)).Contains("6"), "Thông báo quá ngắn nêu đúng ngưỡng 6 ký tự");
Check(Map(nameof(IdentityErrorDescriber.PasswordRequiresUniqueChars)).Contains("1"), "Thông báo ký tự khác nhau nêu đúng ngưỡng 1");
Check(Map(nameof(IdentityErrorDescriber.PasswordMismatch)) == "Mật khẩu hiện tại không đúng.", "Mapper dịch mã sai mật khẩu hiện tại");
Check(Map(nameof(IdentityErrorDescriber.DuplicateEmail)) == "Email đã được đăng ký trong hệ thống.", "Mapper dịch mã email trùng");
Check(Map(nameof(IdentityErrorDescriber.InvalidToken)) == IdentityErrorMessages.GenericResetToken, "Token sai -> thông báo chung, không lộ trạng thái");
Check(Map("UserNotFound") == IdentityErrorMessages.GenericResetToken, "Không tìm thấy user -> cùng thông báo chung với token sai");
Check(Map("CodeMoiTuFramework") == "FALLBACK", "Mã chưa ánh xạ không bao giờ lộ chuỗi tiếng Anh của framework");

// Test đi qua chính con đường app dùng (UserManager.CreateAsync) thay vì tự
// new validator, nên nó khóa luôn cả IValidator mà DI thật đang nạp.
using var scope = provider.CreateScope();
var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

var userCount = 0;
ApplicationUser FreshUser()
{
    var name = $"check.user.{userCount++}";
    return new ApplicationUser { UserName = name, Email = $"{name}@seed.local" };
}

// Mọi mật khẩu mà seed và các bộ smoke đang dùng phải hợp lệ theo đúng policy này,
// nếu không thì client/server lệch nhau và luồng đăng ký đổi mật khẩu fail khó hiểu.
var accepted = new[]
{
    "123Pa$$word!", "Initial1!Passw", "Initial1!Password", "Reset1!Password",
    "Changed1!Password", "Unlocked1!Passw", "Other1!Password",
};
foreach (var password in accepted)
    Check((await userManager.CreateAsync(FreshUser(), password)).Succeeded, $"Mật khẩu đang dùng pass policy: {password}");

var rejected = new[] { "abcdef", "Abcdefgh1", "abcdefgh1!", "ABCDEFGH1!", "Abcdefgh!" };
foreach (var password in rejected)
{
    var result = await userManager.CreateAsync(FreshUser(), password);
    var message = IdentityErrorMessages.Map(result.Errors, "FALLBACK", identityOptions);
    Check(!result.Succeeded && message.StartsWith("Mật khẩu phải"),
        $"Mật khẩu yếu bị chặn kèm thông báo tiếng Việt: {password} -> {message}");
}

Console.WriteLine($"Password policy checks completed ({checks} assertions).");
