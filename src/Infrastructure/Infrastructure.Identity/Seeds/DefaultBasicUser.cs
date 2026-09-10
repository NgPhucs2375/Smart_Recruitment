using Microsoft.AspNetCore.Identity;
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
                FirstName = "Peter",
                LastName = "Griffin",
                EmailConfirmed = true,
                PhoneNumberConfirmed = true
            };
            if (userManager.Users.All(u => u.Id != defaultUser.Id))
            {
                var user = await userManager.FindByEmailAsync(defaultUser.Email);
                if (user == null)
                {
                    await userManager.CreateAsync(defaultUser, "123Pa$$word!");
                    await userManager.AddToRoleAsync(defaultUser, VaiTroNguoiDung.UNG_VIEN.ToString());

                    if (!appContext.NguoiDungs.Any(n => n.ApplicationUserId == defaultUser.Id))
                    {
                        await appContext.NguoiDungs.AddAsync(new NguoiDung
                        {
                            ApplicationUserId = defaultUser.Id,
                            VaiTro = VaiTroNguoiDung.UNG_VIEN,
                            IsActive = true
                        });
                        await appContext.SaveChangesAsync();
                    }
                }

            }
        }
    }
}
