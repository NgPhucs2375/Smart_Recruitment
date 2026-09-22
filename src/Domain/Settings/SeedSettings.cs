namespace Domain.Settings
{
    /// <summary>
    /// Cấu hình khởi tạo tài khoản mặc định (one-time seed).
    /// Bind từ section "Seed" — env tương ứng: Seed__EnableDefaultUsers,
    /// Seed__AdminEmail, Seed__AdminUserName, Seed__AdminPassword, Seed__BasicUserPassword.
    /// Production: chỉ tạo tài khoản khi được bật rõ ràng; tài khoản đã tồn tại
    /// không bao giờ bị reset mật khẩu, unlock, confirm email hay nâng quyền.
    /// </summary>
    public class SeedSettings
    {
        public bool EnableDefaultUsers { get; set; }

        public string AdminEmail { get; set; } = string.Empty;

        public string AdminUserName { get; set; } = string.Empty;

        public string AdminPassword { get; set; } = string.Empty;

        public string BasicUserPassword { get; set; } = string.Empty;
    }
}
