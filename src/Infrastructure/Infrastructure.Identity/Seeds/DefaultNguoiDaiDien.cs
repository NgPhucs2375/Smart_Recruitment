using Microsoft.AspNetCore.Identity;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Identity.Models;
using System.Linq;
using System;
using System.Threading.Tasks;

namespace Infrastructure.Identity.Seeds
{
    public static class DefaultNguoiDaiDien
    {
        public static async Task SeedAsync(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, IApplicationDbContext appContext)
        {
            //Seed Default User (NGUOI_DAI_DIEN)
            var defaultUser = new ApplicationUser
            {
                UserName = "employer",
                Email = "employer@gmail.com",
                FirstName = "Tran",
                LastName = " Nam",
                EmailConfirmed = true,
                PhoneNumberConfirmed = true
            };
            var user = await userManager.FindByEmailAsync(defaultUser.Email);
            if (user == null)
            {
                var createResult = await userManager.CreateAsync(defaultUser, "123Pa$$word!");
                if (!createResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Không thể tạo tài khoản người đại diện (employer): {string.Join("; ", createResult.Errors.Select(error => error.Description))}");
                }
                user = defaultUser;
            }
            else
            {
                // Đảm bảo mật khẩu luôn đúng với seed nếu tài khoản đã tồn tại từ trước
                if (!await userManager.CheckPasswordAsync(user, "123Pa$$word!"))
                {
                    var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
                    await userManager.ResetPasswordAsync(user, resetToken, "123Pa$$word!");
                }

                if (!user.EmailConfirmed)
                {
                    user.EmailConfirmed = true;
                    await userManager.UpdateAsync(user);
                }

                if (user.LockoutEnd.HasValue && user.LockoutEnd > DateTimeOffset.UtcNow)
                {
                    await userManager.SetLockoutEndDateAsync(user, null);
                }
            }

            var nguoiDaiDienRole = VaiTroNguoiDung.NGUOI_DAI_DIEN.ToString();
            if (!await userManager.IsInRoleAsync(user, nguoiDaiDienRole))
                await userManager.AddToRoleAsync(user, nguoiDaiDienRole);

            var profile = appContext.NguoiDungs.FirstOrDefault(n => n.ApplicationUserId == user.Id);
            if (profile == null)
            {
                await appContext.NguoiDungs.AddAsync(new NguoiDung
                {
                    ApplicationUserId = user.Id,
                    VaiTro = VaiTroNguoiDung.NGUOI_DAI_DIEN,
                    IsActive = true
                });
                await appContext.SaveChangesAsync();
            }
            else if (profile.VaiTro != VaiTroNguoiDung.NGUOI_DAI_DIEN || !profile.IsActive)
            {
                profile.VaiTro = VaiTroNguoiDung.NGUOI_DAI_DIEN;
                profile.IsActive = true;
                await appContext.SaveChangesAsync();
            }
        }
    }
}
