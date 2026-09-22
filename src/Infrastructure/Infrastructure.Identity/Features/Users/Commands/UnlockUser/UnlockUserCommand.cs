using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Application.Exceptions;
using Application.Wrappers;
using Infrastructure.Identity.Models;
using Microsoft.AspNetCore.Identity;

namespace Infrastructure.Identity
{
    public class UnlockUserCommand : IRequest<Response<ApplicationUser>>
    {
        public string Id { get; set; }

        public class UnlockUserCommandHandler : IRequestHandler<UnlockUserCommand, Response<ApplicationUser>>
        {
            private readonly UserManager<ApplicationUser> _userManager;

            public UnlockUserCommandHandler(UserManager<ApplicationUser> userManager)
            {
                _userManager = userManager;
            }

            public async Task<Response<ApplicationUser>> Handle(UnlockUserCommand command, CancellationToken cancellationToken)
            {
                var user = await _userManager.FindByIdAsync(command.Id);
                if (user == null) throw new ApiException($"Không tìm thấy tài khoản.");

                await _userManager.SetLockoutEndDateAsync(user, null);
                await _userManager.ResetAccessFailedCountAsync(user);

                return new Response<ApplicationUser>(user, "Đã mở khóa tài khoản.");
            }
        }
    }
}
