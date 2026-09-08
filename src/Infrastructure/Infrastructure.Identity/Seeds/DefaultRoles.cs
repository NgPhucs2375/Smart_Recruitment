using Microsoft.AspNetCore.Identity;
using Domain.Enums;
using Infrastructure.Identity.Models;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using System.Linq;
using System.IO;
using System.Security.Claims;

namespace Infrastructure.Identity.Seeds
{
    public static class DefaultRoles
    {
        public static async Task SeedAsync(UserManager<ApplicationUser> um, RoleManager<IdentityRole> rm, string webRootPath = null)
        {
            var roles = new[]{
                VaiTroNguoiDung.QUAN_TRI_VIEN,
                VaiTroNguoiDung.NGUOI_DAI_DIEN,
                VaiTroNguoiDung.NHAN_SU,
                VaiTroNguoiDung.UNG_VIEN
            };
            foreach (var r in roles) 
                if (!await rm.RoleExistsAsync(r.ToString())) 
                    await rm.CreateAsync(new IdentityRole(r.ToString()));

            // Đọc policy.csv làm nguồn truth ban đầu → group (role, resource) → actions "#"
            // Nếu policy.csv không tồn tại (publish) thì thử fallback wwwroot
            var csv = webRootPath != null ? Path.Combine(webRootPath, "policy.csv") : null;
            if (csv == null || !File.Exists(csv))
            {
                var fallback = Path.Combine(AppContext.BaseDirectory, "wwwroot", "policy.csv");
                if (File.Exists(fallback)) csv = fallback;
                else return;
            }

            var groups = (await File.ReadAllLinesAsync(csv))
                .Where(l => l.TrimStart().StartsWith("p,")).Select(l => l.Split(",").Select(s => s.Trim()).ToArray())
                .Where(p => p.Length >= 4)
                .GroupBy(p => (role: p[1], resource: p[2])).ToDictionary(g => g.Key, g => g.Select(x => x[3]).Distinct().OrderBy(a => a).ToArray());
                
            foreach (var kv in groups)
            {
                var role = await rm.FindByNameAsync(kv.Key.role);
                var existing = (await rm.GetClaimsAsync(role)).FirstOrDefault(c => c.Type == kv.Key.resource);
                var wanted = string.Join("#", kv.Value);
                if (existing == null) await rm.AddClaimAsync(role, new Claim(kv.Key.resource, wanted));
                else if (existing.Value != wanted) { await rm.RemoveClaimAsync(role, existing); await rm.AddClaimAsync(role, new Claim(kv.Key.resource, wanted)); }
            }
        }
    }
}
