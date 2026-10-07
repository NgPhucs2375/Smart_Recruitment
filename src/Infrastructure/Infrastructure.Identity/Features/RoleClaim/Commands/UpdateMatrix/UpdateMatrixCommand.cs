using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Exceptions;
using Application.Wrappers;
using Infrastructure.Identity.Contexts;
using Infrastructure.Identity.Services;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Identity.Features.RoleClaim.Commands.UpdateMatrix;

public class UpdateMatrixCommand : IRequest<Response<object>>
{
    public Dictionary<string, Dictionary<string, string[]>> Matrix { get; set; }
}

public class UpdateMatrixCommandHandler(IdentityContext context, PermissionCache cache)
    : IRequestHandler<UpdateMatrixCommand, Response<object>>
{
    public async Task<Response<object>> Handle(UpdateMatrixCommand request, CancellationToken ct)
    {
        if (request.Matrix == null) throw new ApiException("Matrix không được rỗng.", 400);
        var replacement = new List<IdentityRoleClaim<string>>();
        var roleIds = new List<string>();
        // Validate the whole request before any database/cache mutation.
        foreach (var entry in request.Matrix)
        {
            if (!PermissionPolicy.IsSystemRole(entry.Key) || entry.Value == null) throw new ApiException("Vai trò/ma trận không hợp lệ.", 400);
            var role = await context.Roles.SingleOrDefaultAsync(r => r.Name == entry.Key, ct) ?? throw new ApiException("Không tìm thấy vai trò.", 404);
            roleIds.Add(role.Id);
            var seen = new HashSet<string>();
            foreach (var resource in entry.Value)
            {
                var grant = PermissionPolicy.Normalize(role.Name, resource.Key, resource.Value);
                if (!seen.Add(grant.Resource)) throw new ApiException("Resource trùng sau khi chuẩn hóa.", 400);
                if (grant.Actions.Length > 0)
                    replacement.Add(new IdentityRoleClaim<string> { RoleId = role.Id, ClaimType = grant.Resource, ClaimValue = string.Join("#", grant.Actions) });
            }
        }
        await using var transaction = await context.Database.BeginTransactionAsync(ct);
        var old = await context.RoleClaims.Where(c => roleIds.Contains(c.RoleId)).ToListAsync(ct);
        context.RoleClaims.RemoveRange(old);
        await context.SaveChangesAsync(ct);
        context.RoleClaims.AddRange(replacement);
        await context.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        await cache.RefreshAsync();
        return new Response<object>(true, new { updated = replacement.Sum(c => c.ClaimValue.Split('#').Length) }, "Cập nhật ma trận quyền thành công");
    }
}
