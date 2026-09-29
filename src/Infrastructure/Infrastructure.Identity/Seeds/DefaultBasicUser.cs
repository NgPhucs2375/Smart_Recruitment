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
    public static class DefaultBasicUser
    {
        public static async Task SeedAsync(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, IApplicationDbContext appContext)
        {
            //Seed Default User (UNG_VIEN)
            var defaultUser = new ApplicationUser
            {
                UserName = "basicuser",
                Email = "basicuser@gmail.com",
                FirstName = "Peter",
                LastName = "Griffin",
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
                        $"Không thể tạo tài khoản ứng viên (basicuser): {string.Join("; ", createResult.Errors.Select(error => error.Description))}");
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

            var ungVienRole = VaiTroNguoiDung.UNG_VIEN.ToString();
            if (!await userManager.IsInRoleAsync(user, ungVienRole))
                await userManager.AddToRoleAsync(user, ungVienRole);

            var profile = appContext.NguoiDungs.FirstOrDefault(n => n.ApplicationUserId == user.Id);
            if (profile == null)
            {
                await appContext.NguoiDungs.AddAsync(new NguoiDung
                {
                    ApplicationUserId = user.Id,
                    VaiTro = VaiTroNguoiDung.UNG_VIEN,
                    IsActive = true
                });
                await appContext.SaveChangesAsync();
            }
            else if (profile.VaiTro != VaiTroNguoiDung.UNG_VIEN || !profile.IsActive)
            {
                profile.VaiTro = VaiTroNguoiDung.UNG_VIEN;
                profile.IsActive = true;
                await appContext.SaveChangesAsync();
            }
        }
    }
}