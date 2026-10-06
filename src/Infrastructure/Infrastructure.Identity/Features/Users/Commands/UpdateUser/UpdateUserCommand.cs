using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Application.Exceptions;
using Application.Wrappers;
using Infrastructure.Identity.Models;
using Microsoft.AspNetCore.Identity;
using Application.Interfaces;
using Domain.Enums;
using System;

namespace Infrastructure.Identity
{
    public class UpdateUserCommand : IRequest<Response<ApplicationUser>>
    {
        public string Id { get; set; }
        public string RoleId { get; set; }
        public bool EmailConfirmed { get; set; }

        public class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand, Response<ApplicationUser>>
        {
            private readonly RoleManager<IdentityRole> _roleManager;
            private readonly UserManager<ApplicationUser> _userManager;
            private readonly IUserRoleService _roles;
            public UpdateUserCommandHandler(
                UserManager<ApplicationUser> userManager,
                RoleManager<IdentityRole> roleManager, IUserRoleService roles
                )
            {
                _userManager = userManager;
                _roleManager = roleManager;
                _roles = roles;
            }

            public async Task<Response<ApplicationUser>> Handle(UpdateUserCommand command, CancellationToken cancellationToken)
            {
                var user = await _userManager.FindByIdAsync(command.Id);
                if (user == null) throw new ApiException($"User Not Found.");
                user.EmailConfirmed = command.EmailConfirmed;
                if (!string.IsNullOrWhiteSpace(command.RoleId))
                {
                    var role = await _roleManager.FindByIdAsync(command.RoleId);
                    if (role == null || !Enum.TryParse<VaiTroNguoiDung>(role.Name, out var parsed))
                        throw new ApiException("Vai trò không hợp lệ.");
                    await _roles.SetRoleAsync(user.Id, parsed, ct: cancellationToken);
                }
                var result = await _userManager.UpdateAsync(user);
                if (!result.Succeeded) throw new ApiException("Không cập nhật được tài khoản.");
                return new Response<ApplicationUser>(user);
            }
        }
    }
}
