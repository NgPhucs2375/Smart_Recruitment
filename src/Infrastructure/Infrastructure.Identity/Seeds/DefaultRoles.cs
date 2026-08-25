using Microsoft.AspNetCore.Identity;
using Application.Enums;
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
            await roleManager.CreateAsync(new IdentityRole(Roles.QuanTriVien.ToString()));
            await roleManager.CreateAsync(new IdentityRole(Roles.NhaTuyenDung.ToString()));
            await roleManager.CreateAsync(new IdentityRole(Roles.UngVien.ToString()));
        }
    }
}
