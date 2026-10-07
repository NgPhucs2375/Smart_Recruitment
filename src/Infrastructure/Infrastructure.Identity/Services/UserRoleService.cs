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
        var obsolete = current.Where(x => x != name).ToArray();
        var profile = await app.NguoiDungs.AsTracking().SingleOrDefaultAsync(x => x.ApplicationUserId == applicationUserId, ct);
        var existed = profile != null;
        var previousRole = profile?.VaiTro;
        var previousActive = profile?.IsActive;
        try
        {
            if (obsolete.Length > 0) Ensure(await users.RemoveFromRolesAsync(user, obsolete));
            if (!current.Contains(name)) Ensure(await users.AddToRoleAsync(user, name));
            if (profile == null)
            {
                profile = new NguoiDung { ApplicationUserId = applicationUserId, IsActive = true };
                app.NguoiDungs.Add(profile);
            }
            profile.VaiTro = role;
            if (active.HasValue) profile.IsActive = active.Value;
            await app.SaveChangesAsync(ct);
        }
        catch
        {
            // Separate Identity/domain contexts: compensate a failed domain save.
            // BearerSessionValidator rejects inconsistent roles during the transition.
            var assigned = await users.GetRolesAsync(user);
            var added = assigned.Except(current).ToArray();
            var removed = current.Except(assigned).ToArray();
            if (added.Length > 0) Ensure(await users.RemoveFromRolesAsync(user, added));
            if (removed.Length > 0) Ensure(await users.AddToRolesAsync(user, removed));
            if (profile != null)
            {
                if (!existed) app.NguoiDungs.Remove(profile);
                else { profile.VaiTro = previousRole!.Value; profile.IsActive = previousActive!.Value; }
            }
            throw;
        }
    }
    private static void Ensure(IdentityResult result)
    { if (!result.Succeeded) throw new ApiException(string.Join("; ", result.Errors.Select(x => x.Description))); }
}
