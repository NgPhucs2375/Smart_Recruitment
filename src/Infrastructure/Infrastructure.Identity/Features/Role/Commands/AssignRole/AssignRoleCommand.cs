using System;
using System.Threading;
using System.Threading.Tasks;
using Application.Exceptions;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;

namespace Infrastructure.Identity.Features.Role.Commands.AssignRole;

public class AssignRoleCommand : IRequest<Response<string>>
{
    public string UserId { get; set; }
    public string RoleName { get; set; }
}
public class AssignRoleCommandHandler(IUserRoleService roles) : IRequestHandler<AssignRoleCommand, Response<string>>
{
    public async Task<Response<string>> Handle(AssignRoleCommand request, CancellationToken ct)
    {
        if (!Enum.TryParse<VaiTroNguoiDung>(request.RoleName, true, out var role) || !Enum.IsDefined(role))
            throw new ApiException("Vai trò không hợp lệ.");
        await roles.SetRoleAsync(request.UserId, role, ct: ct);
        return new Response<string>(role.ToString(), "Đã đồng bộ vai trò người dùng.");
    }
}
