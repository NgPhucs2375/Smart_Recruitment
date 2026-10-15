using System.Threading;
using System.Threading.Tasks;
using Application.Exceptions;
using Application.Wrappers;
using Infrastructure.Identity.Contexts;
using Infrastructure.Identity.Services;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Identity.Features.RoleClaim.Commands.UpdateRoleClaim;

public class UpdateRoleClaimCommand : IRequest<Response<IdentityRoleClaim<string>>>
{
    public int Id { get; set; }
    public string ClaimType { get; set; }
    public string[] ClaimValue { get; set; }

    public class UpdateRoleClaimCommandHandler(IdentityContext context, PermissionCache cache)
        : IRequestHandler<UpdateRoleClaimCommand, Response<IdentityRoleClaim<string>>>
    {
        public async Task<Response<IdentityRoleClaim<string>>> Handle(UpdateRoleClaimCommand request, CancellationToken ct)
        {
            var claim = await context.RoleClaims.FindAsync([request.Id], ct) ?? throw new ApiException("Không tìm thấy quyền.", 404);
            var role = await context.Roles.FindAsync([claim.RoleId], ct) ?? throw new ApiException("Không tìm thấy vai trò.", 404);
            var grant = PermissionPolicy.Normalize(role.Name, request.ClaimType, request.ClaimValue);
            if (await context.RoleClaims.AnyAsync(c => c.Id != claim.Id && c.RoleId == role.Id && c.ClaimType == grant.Resource, ct))
                throw new ApiException("Resource đã có quyền cho vai trò này.", 409);
            claim.ClaimType = grant.Resource;
            claim.ClaimValue = string.Join("#", grant.Actions);
            try { await context.SaveChangesAsync(ct); }
            catch (DbUpdateException ex) when (ex.InnerException is Npgsql.PostgresException { SqlState: "23505" })
            { throw new ApiException("Resource đã có quyền cho vai trò này.", 409); }
            await cache.RefreshAsync();
            return new Response<IdentityRoleClaim<string>>(claim);
        }
    }
}
