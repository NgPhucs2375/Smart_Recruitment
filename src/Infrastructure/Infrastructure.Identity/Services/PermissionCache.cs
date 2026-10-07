#nullable enable
using System;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Casbin;
using Infrastructure.Identity.Contexts;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Identity.Services;

/// <summary>Derived cache only. Database grants remain authoritative if export fails.</summary>
public sealed class PermissionCache(IdentityContext db, IWebHostEnvironment env, Enforcer enforcer, ILogger<PermissionCache> logger)
{
    private static readonly SemaphoreSlim Gate = new(1, 1);
    public async Task RefreshAsync()
    {
        await Gate.WaitAsync();
        string? temp = null;
        try
        {
            var claims = await (from claim in db.RoleClaims.AsNoTracking()
                                join role in db.Roles.AsNoTracking() on claim.RoleId equals role.Id
                                select new { Role = role.Name, Resource = claim.ClaimType, Actions = claim.ClaimValue }).ToListAsync();
            var lines = claims.Where(c => c.Role != null && c.Resource != null)
                .SelectMany(c => (c.Actions ?? "").Split('#', StringSplitOptions.RemoveEmptyEntries)
                    .Where(a => PermissionPolicy.IsEffective(c.Role!, c.Resource!, a))
                    .Select(a => $"p, {c.Role}, {c.Resource}, {a}"))
                .Distinct().OrderBy(s => s).ToArray();
            var path = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "policy.csv");
            temp = path + "." + Guid.NewGuid().ToString("N") + ".tmp";
            await File.WriteAllLinesAsync(temp, lines);
            File.Move(temp, path, true);
            await enforcer.LoadPolicyAsync();
        }
        catch (Exception ex) { logger.LogWarning(ex, "Không xuất được policy cache; API tiếp tục dùng quyền trong database."); }
        finally
        {
            try { if (temp != null && File.Exists(temp)) File.Delete(temp); }
            catch (IOException ex) { logger.LogWarning(ex, "Không xóa được policy cache tạm."); }
            finally { Gate.Release(); }
        }
    }
}
