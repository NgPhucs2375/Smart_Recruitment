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
    public static class DefaultSuperAdmin
    {
        public static async Task SeedAsync(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, IApplicationDbContext appContext)
        {
            //Seed Default User
            var defaultUser = new ApplicationUser
            {
                UserName = "superadmin",
                Email = "superadmin@gmail.com",
                FirstName = "Andreas",
                LastName = " Kudras",
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
                        $"Không thể tạo tài khoản superadmin: {string.Join("; ", createResult.Errors.Select(error => error.Description))}");
                }
            }

            var adminRole = VaiTroNguoiDung.QUAN_TRI_VIEN.ToString();
            if (!await userManager.IsInRoleAsync(user, adminRole))
                await userManager.AddToRoleAsync(user, adminRole);

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
            else if (profile.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN || !profile.IsActive)
            {
                profile.VaiTro = VaiTroNguoiDung.QUAN_TRI_VIEN;
                profile.IsActive = true;
                await appContext.SaveChangesAsync();
            }
        }
    }
}
