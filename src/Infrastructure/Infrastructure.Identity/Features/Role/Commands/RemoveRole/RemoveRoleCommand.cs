using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Application.Wrappers;
using Application.Interfaces;

namespace Infrastructure.Identity.Features.Role.Commands.RemoveRole
{
    public class RemoveRoleCommand : IRequest<Response<string>>
    {
        public string UserId { get; set; }
        public string RoleName { get; set; }
    }

    // Ủy quyền toàn bộ cho UserRoleService để dùng chung logic bù trừ 2 DbContext
    // với SetRoleAsync (tránh split-brain khi save domain thất bại sau khi gỡ role).
    public class RemoveRoleCommandHandler(IUserRoleService roles) : IRequestHandler<RemoveRoleCommand, Response<string>>
    {
        public async Task<Response<string>> Handle(RemoveRoleCommand request, CancellationToken ct)
        {
            await roles.RemoveRoleAsync(request.UserId, request.RoleName, ct);
            return new Response<string>(request.RoleName, $"Đã gỡ vai trò '{request.RoleName}' khỏi người dùng.");
        }
    }
}
