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
            if (userManager.Users.All(u => u.Id != defaultUser.Id))
            {
                var user = await userManager.FindByEmailAsync(defaultUser.Email);
                if (user == null)
                {
                    await userManager.CreateAsync(defaultUser, "123Pa$$word!");
                    await userManager.AddToRoleAsync(defaultUser, Roles.QuanTriVien.ToString());

                    var role = await roleManager.FindByNameAsync(Roles.QuanTriVien.ToString());

                    var claim = new System.Security.Claims.Claim("roleclaims", "list#create#edit#delete");
                    await roleManager.AddClaimAsync(role, claim);
                    var userClaims = new System.Security.Claims.Claim("users", "list#create");
                    await roleManager.AddClaimAsync(role, userClaims);
                    var rolec = new System.Security.Claims.Claim("roles", "list#create#edit#delete");
                    await roleManager.AddClaimAsync(role, rolec);

                    if (!appContext.nguoiDungs.Any(n => n.ApplicationUserId == defaultUser.Id))
                    {
                        await appContext.nguoiDungs.AddAsync(new nguoiDung
                        {
                            ApplicationUserId = defaultUser.Id,
                            vaiTro = VaiTroNguoiDung.QUAN_TRI_VIEN,
                            Is_Active = true
                        });
                        await appContext.SaveChangesAsync();
                    }
                }

            }
        }
    }
}
