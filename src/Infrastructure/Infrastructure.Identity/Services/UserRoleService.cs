using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Exceptions;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Identity.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Identity.Services;

public class UserRoleService(UserManager<ApplicationUser> users, RoleManager<IdentityRole> roles, IApplicationDbContext app) : IUserRoleService
{
    public async Task SetRoleAsync(string applicationUserId, VaiTroNguoiDung role, bool? active = null, CancellationToken ct = default)
    {
        if (!Enum.IsDefined(role)) throw new ApiException("Vai trò không hợp lệ.");
        var user = await users.FindByIdAsync(applicationUserId) ?? throw new ApiException("Không tìm thấy tài khoản.");
        var name = role.ToString();
        if (!await roles.RoleExistsAsync(name)) throw new ApiException("Vai trò chưa được cấu hình.");
        var current = await users.GetRolesAsync(user);
        var obsolete = current.Where(x => Enum.TryParse<VaiTroNguoiDung>(x, out _) && x != name).ToArray();
        if (obsolete.Length > 0) Ensure(await users.RemoveFromRolesAsync(user, obsolete));
        if (!current.Contains(name)) Ensure(await users.AddToRoleAsync(user, name));
        var profile = await app.NguoiDungs.AsTracking().SingleOrDefaultAsync(x => x.ApplicationUserId == applicationUserId, ct);
        if (profile == null)
        {
            profile = new NguoiDung { ApplicationUserId = applicationUserId, IsActive = true };
            app.NguoiDungs.Add(profile);
        }
        profile.VaiTro = role;
        if (active.HasValue) profile.IsActive = active.Value;
        await app.SaveChangesAsync(ct);
    }
    private static void Ensure(IdentityResult result)
    { if (!result.Succeeded) throw new ApiException(string.Join("; ", result.Errors.Select(x => x.Description))); }
}
