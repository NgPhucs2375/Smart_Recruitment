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
    public class LockUserCommand : IRequest<Response<ApplicationUser>>
    {
        public string Id { get; set; }

        public class LockUserCommandHandler : IRequestHandler<LockUserCommand, Response<ApplicationUser>>
        {
            private readonly UserManager<ApplicationUser> _userManager;

            public LockUserCommandHandler(UserManager<ApplicationUser> userManager)
            {
                _userManager = userManager;
            }

            public async Task<Response<ApplicationUser>> Handle(LockUserCommand command, CancellationToken cancellationToken)
            {
                var user = await _userManager.FindByIdAsync(command.Id);
                if (user == null) throw new ApiException($"Không tìm thấy tài khoản.");

                await _userManager.SetLockoutEnabledAsync(user, true);
                await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);

                return new Response<ApplicationUser>(user, "Đã khóa tài khoản.");
            }
        }
    }
}
