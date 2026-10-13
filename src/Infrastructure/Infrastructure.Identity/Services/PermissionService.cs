using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Exceptions;
using Application.Interfaces;
using Infrastructure.Identity.Contexts;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Identity.Services;

public sealed class PermissionService(IdentityContext db, IAuthenticatedUserService auth) : IPermissionService
{
    public async Task RequireAsync(string resource, string action, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(auth.UserId)) throw new ApiException("Bạn cần đăng nhập.", 401);
        var grants = await (from membership in db.UserRoles
                            join claim in db.RoleClaims on membership.RoleId equals claim.RoleId
                            join role in db.Roles on membership.RoleId equals role.Id
                            where membership.UserId == auth.UserId && claim.ClaimType == resource
                            select new { role.Name, claim.ClaimValue }).ToListAsync(ct);
        if (!grants.Any(g => PermissionPolicy.IsEffective(g.Name ?? "", resource, action) &&
                (g.ClaimValue ?? "").Split('#', StringSplitOptions.RemoveEmptyEntries).Contains(action, StringComparer.OrdinalIgnoreCase)))
            throw new ApiException("Bạn không có quyền thực hiện hành động này.", 403);
    }
}
