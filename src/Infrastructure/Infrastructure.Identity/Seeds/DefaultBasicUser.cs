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
    public static class DefaultBasicUser
    {
        /// <summary>
        /// Tạo tài khoản demo MỘT LẦN khi được bật rõ ràng qua SeedSettings.
        /// - Không dùng mật khẩu hardcode: thiếu Seed:BasicUserPassword thì throw.
        /// - Tài khoản đã tồn tại: trả về ngay, không thay đổi bất cứ thứ gì.
        /// - Production mặc định tắt (EnableDefaultUsers=false) nên không tạo tài khoản demo.
        /// </summary>
        public static async Task SeedAsync(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IApplicationDbContext appContext,
            SeedSettings seed)
        {
            if (seed == null || !seed.EnableDefaultUsers)
                return;

            var password = seed.BasicUserPassword ?? string.Empty;
            if (string.IsNullOrWhiteSpace(password))
                throw new InvalidOperationException(
                    "Seed:BasicUserPassword is required when Seed:EnableDefaultUsers is true. " +
                    "Set the Seed__BasicUserPassword environment variable.");

            const string email = "basicuser@gmail.com";

            // One-time seed: đã tồn tại thì giữ nguyên toàn bộ dữ liệu hiện có.
            var existing = await userManager.FindByEmailAsync(email);
            if (existing != null)
                return;

            var defaultUser = new ApplicationUser
            {
                UserName = "basicuser",
                Email = email,
                FirstName = "Demo",
                LastName = "User",
                EmailConfirmed = true,
                PhoneNumberConfirmed = false
            };

            var createResult = await userManager.CreateAsync(defaultUser, password);
            if (!createResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Không thể tạo tài khoản demo: {string.Join("; ", createResult.Errors.Select(error => error.Description))}");
            }

            var user = await userManager.FindByEmailAsync(email)
                ?? throw new InvalidOperationException("Không tìm thấy tài khoản demo vừa tạo.");

            await userManager.AddToRoleAsync(user, VaiTroNguoiDung.UNG_VIEN.ToString());

            if (!appContext.NguoiDungs.Any(n => n.ApplicationUserId == user.Id))
            {
                await appContext.NguoiDungs.AddAsync(new NguoiDung
                {
                    ApplicationUserId = user.Id,
                    VaiTro = VaiTroNguoiDung.UNG_VIEN,
                    IsActive = true
                });
                await appContext.SaveChangesAsync();
            }
        }
    }
}
