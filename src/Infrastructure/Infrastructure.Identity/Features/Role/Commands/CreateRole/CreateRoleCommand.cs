using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Application.Wrappers;
using Microsoft.AspNetCore.Identity;

namespace Infrastructure.Identity.Features.Role.Commands.CreateRole
{
    public class CreateRoleCommand : IRequest<Response<IdentityRole>>
    {
        public string Name { get; set; }

        public class CreateRoleCommandHandler : IRequestHandler<CreateRoleCommand, Response<IdentityRole>>
        {
            private readonly RoleManager<IdentityRole> _roleManager;

            public CreateRoleCommandHandler(RoleManager<IdentityRole> roleManager)
            {
                _roleManager = roleManager;
            }

            public async Task<Response<IdentityRole>> Handle(CreateRoleCommand request, CancellationToken cancellationToken)
            {
                if (!Enum.TryParse<Domain.Enums.VaiTroNguoiDung>(request.Name, out var systemRole) || !Enum.IsDefined(systemRole) || systemRole.ToString() != request.Name)
                    throw new Application.Exceptions.ApiException("Chỉ hỗ trợ bốn vai trò hệ thống.", 400);
                var role = new IdentityRole(request.Name);
                var result = await _roleManager.CreateAsync(role);
                if (result.Succeeded)
                {
                    return new Response<IdentityRole>(role);
                }
                throw new Exception(string.Join(", ", result.Errors));
            }
        }
    }
}
