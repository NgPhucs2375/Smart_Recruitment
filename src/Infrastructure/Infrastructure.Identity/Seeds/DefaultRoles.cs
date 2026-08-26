using Microsoft.AspNetCore.Identity;
using Domain.Enums;
using Infrastructure.Identity.Models;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Identity.Seeds
{
    public static class DefaultRoles
    {
        public static async Task SeedAsync(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
        {
            //Seed Roles
            await roleManager.CreateAsync(new IdentityRole(VaiTroNguoiDung.QUAN_TRI_VIEN.ToString()));
            await roleManager.CreateAsync(new IdentityRole(VaiTroNguoiDung.NHA_TUYEN_DUNG.ToString()));
            await roleManager.CreateAsync(new IdentityRole(VaiTroNguoiDung.UNG_VIEN.ToString()));
        }
    }
}
