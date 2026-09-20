using Microsoft.AspNetCore.Identity;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.Settings;
using Infrastructure.Identity.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure.Identity.Seeds
{
    public static class DefaultSuperAdmin
    {
        /// <summary>
        /// Tạo tài khoản quản trị MỘT LẦN khi được bật rõ ràng qua SeedSettings.
        /// - Không dùng mật khẩu hardcode: thiếu Seed:AdminEmail/AdminPassword thì throw.
        /// - Tài khoản đã tồn tại: trả về ngay, KHÔNG reset mật khẩu, KHÔNG unlock,
        ///   KHÔNG confirm email, KHÔNG nâng quyền, KHÔNG ghi đè hồ sơ.
        /// - Không ghi mật khẩu vào log (caller chịu trách nhiệm log trạng thái chung).
        /// </summary>
        public static async Task SeedAsync(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IApplicationDbContext appContext,
            SeedSettings seed)
        {
            if (seed == null || !seed.EnableDefaultUsers)
                return;

            var email = (seed.AdminEmail ?? string.Empty).Trim();
            var password = seed.AdminPassword ?? string.Empty;
            if (string.IsNullOrWhiteSpace(email))
                throw new InvalidOperationException(
                    "Seed:AdminEmail is required when Seed:EnableDefaultUsers is true. " +
                    "Set the Seed__AdminEmail environment variable.");
            if (string.IsNullOrWhiteSpace(password))
                throw new InvalidOperationException(
                    "Seed:AdminPassword is required when Seed:EnableDefaultUsers is true. " +
                    "Set the Seed__AdminPassword environment variable.");

            // One-time seed: tài khoản đã tồn tại thì không chạm vào bất cứ thứ gì.
            var existing = await userManager.FindByEmailAsync(email);
            if (existing != null)
                return;

            var userName = string.IsNullOrWhiteSpace(seed.AdminUserName)
                ? email
                : seed.AdminUserName.Trim();

            var defaultUser = new ApplicationUser
            {
                UserName = userName,
                Email = email,
                FirstName = "Administrator",
                LastName = string.Empty,
                // Tài khoản do operator chủ động provision qua env nên đánh dấu đã xác minh,
                // chỉ áp dụng cho tài khoản MỚI tạo. Tài khoản cũ không bao giờ bị đổi cờ này.
                EmailConfirmed = true,
                PhoneNumberConfirmed = false
            };

            var createResult = await userManager.CreateAsync(defaultUser, password);
            if (!createResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Không thể tạo tài khoản quản trị: {string.Join("; ", createResult.Errors.Select(error => error.Description))}");
            }

            var user = await userManager.FindByEmailAsync(email)
                ?? throw new InvalidOperationException("Không tìm thấy tài khoản quản trị vừa tạo.");

            var adminRole = VaiTroNguoiDung.QUAN_TRI_VIEN.ToString();
            if (!await userManager.IsInRoleAsync(user, adminRole))
                await userManager.AddToRoleAsync(user, adminRole);

            // Chỉ tạo hồ sơ khi chưa có; hồ sơ đã tồn tại thì giữ nguyên.
            var profile = appContext.NguoiDungs.FirstOrDefault(n => n.ApplicationUserId == user.Id);
            if (profile == null)
            {
                await appContext.NguoiDungs.AddAsync(new NguoiDung
                {
                    ApplicationUserId = user.Id,
                    VaiTro = VaiTroNguoiDung.QUAN_TRI_VIEN,
                    IsActive = true
                });
                await appContext.SaveChangesAsync();
            }
        }
    }
}
