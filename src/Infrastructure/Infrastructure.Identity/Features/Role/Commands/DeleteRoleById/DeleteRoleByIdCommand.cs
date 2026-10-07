using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Application.Wrappers;
using Microsoft.AspNetCore.Identity;

namespace Infrastructure.Identity.Features.Role.Commands.DeleteRoleById
{
    public class DeleteRoleByIdCommand : IRequest<Response<IdentityRole>>
    {
        public string Id { get; set; }
        public class DeleteRoleByIdCommandHandler : IRequestHandler<DeleteRoleByIdCommand, Response<IdentityRole>>
        {
            private readonly RoleManager<IdentityRole> _roleManager;
            public DeleteRoleByIdCommandHandler(RoleManager<IdentityRole> roleManager)
            {
                _roleManager = roleManager;
            }
            public async Task<Response<IdentityRole>> Handle(DeleteRoleByIdCommand command, CancellationToken cancellationToken)
            {
                var role = await _roleManager.FindByIdAsync(command.Id);
                if (role == null) throw new Exception($"Role Not Found.");
                if (Enum.TryParse<Domain.Enums.VaiTroNguoiDung>(role.Name, out var systemRole) && Enum.IsDefined(systemRole))
                    throw new Application.Exceptions.ApiException("Không được xóa vai trò hệ thống; hãy thu hồi quyền trong ma trận.", 400);
                var result = await _roleManager.DeleteAsync(role);
                if (!result.Succeeded) throw new Application.Exceptions.ApiException(string.Join("; ", System.Linq.Enumerable.Select(result.Errors, e => e.Description)));
                return new Response<IdentityRole>(role);
            }
        }
    }
}
