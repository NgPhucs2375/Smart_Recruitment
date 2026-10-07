using System.Threading;
using System.Threading.Tasks;
using Application.Exceptions;
using Application.Wrappers;
using Infrastructure.Identity.Contexts;
using Infrastructure.Identity.Services;
using MediatR;
using Microsoft.AspNetCore.Identity;

namespace Infrastructure.Identity.Features.RoleClaim.Commands.DeleteRoleClaimById;

public class DeleteRoleClaimByIdCommand : IRequest<Response<IdentityRoleClaim<string>>>
{
    public int Id { get; set; }

    public class DeleteRoleClaimByIdCommandHandler(IdentityContext context, PermissionCache cache)
        : IRequestHandler<DeleteRoleClaimByIdCommand, Response<IdentityRoleClaim<string>>>
    {
        public async Task<Response<IdentityRoleClaim<string>>> Handle(DeleteRoleClaimByIdCommand request, CancellationToken ct)
        {
            var claim = await context.RoleClaims.FindAsync([request.Id], ct) ?? throw new ApiException("Không tìm thấy quyền.", 404);
            context.RoleClaims.Remove(claim);
            await context.SaveChangesAsync(ct);
            await cache.RefreshAsync();
            return new Response<IdentityRoleClaim<string>>(claim);
        }
    }
}
