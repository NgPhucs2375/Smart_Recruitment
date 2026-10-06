using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Application.Interfaces;
using Infrastructure.Identity.Contexts;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Identity.Services;

public static class BearerSessionValidator
{
    public static async Task ValidateAsync(TokenValidatedContext context)
    {
        if (context.Principal?.Identity is not ClaimsIdentity identity) { context.Fail("Missing identity."); return; }
        var uid = identity.FindFirst("uid")?.Value;
        var stamp = identity.FindFirst("sst")?.Value;
        if (string.IsNullOrWhiteSpace(uid) || string.IsNullOrWhiteSpace(stamp))
        { context.Fail("Session must be renewed."); return; }
        var services = context.HttpContext.RequestServices;
        var db = services.GetRequiredService<IdentityContext>();
        var ct = context.HttpContext.RequestAborted;
        var user = await db.Users.AsNoTracking().Where(u => u.Id == uid)
            .Select(u => new { u.SecurityStamp, u.EmailConfirmed, u.LockoutEnabled, u.LockoutEnd }).SingleOrDefaultAsync(ct);
        if (user == null || user.SecurityStamp != stamp || !user.EmailConfirmed ||
            (user.LockoutEnabled && user.LockoutEnd > DateTimeOffset.UtcNow))
        { context.Fail("Session revoked or account disabled."); return; }
        if (!await services.GetRequiredService<IApplicationDbContext>().NguoiDungs.AsNoTracking()
            .AnyAsync(u => u.ApplicationUserId == uid && u.IsActive, ct))
        { context.Fail("Account is inactive."); return; }
        var roles = await db.UserRoles.Where(ur => ur.UserId == uid).Join(db.Roles,
            ur => ur.RoleId, role => role.Id, (_, role) => role.Name).Where(name => name != null).ToListAsync(ct);
        if (roles.Count == 0) { context.Fail("Account has no roles."); return; }
        foreach (var claim in identity.Claims.Where(c => c.Type == ClaimTypes.Role || c.Type == "roles" || c.Type == "permission").ToList())
            identity.RemoveClaim(claim);
        foreach (var role in roles) identity.AddClaim(new Claim(ClaimTypes.Role, role));
        identity.AddClaim(new Claim("permission", roles[0]));
    }
}
