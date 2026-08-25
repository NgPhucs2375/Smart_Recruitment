using Microsoft.AspNetCore.Identity;
using Application.Enums;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Identity.Models;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure.Identity.Seeds
{
    public static class DefaultBasicUser
    {
        public static async Task SeedAsync(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, IApplicationDbContext appContext)
        {
            //Seed Default User
            var defaultUser = new ApplicationUser
            {
                UserName = "basicuser",
                Email = "basicuser@gmail.com",
                FirstName = "John",
                LastName = "Doe",
                EmailConfirmed = true,
                PhoneNumberConfirmed = true
            };
            if (userManager.Users.All(u => u.Id != defaultUser.Id))
            {
                var user = await userManager.FindByEmailAsync(defaultUser.Email);
                if (user == null)
                {
                    await userManager.CreateAsync(defaultUser, "123Pa$$word!");
                    await userManager.AddToRoleAsync(defaultUser, Roles.UngVien.ToString());

                    if (!appContext.nguoiDungs.Any(n => n.ApplicationUserId == defaultUser.Id))
                    {
                        await appContext.nguoiDungs.AddAsync(new nguoiDung
                        {
                            ApplicationUserId = defaultUser.Id,
                            vaiTro = VaiTroNguoiDung.UNG_VIEN,
                            Is_Active = true
                        });
                        await appContext.SaveChangesAsync();
                    }
                }

            }
        }
    }
}
