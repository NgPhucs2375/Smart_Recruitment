using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Application.Exceptions;
using Application.Wrappers;
using Infrastructure.Identity.Models;
using Microsoft.AspNetCore.Identity;
using Infrastructure.Identity.Contexts;
using Microsoft.EntityFrameworkCore;
using Application.DTOs.Account;

namespace Infrastructure.Identity
{
    public class DeleteUserByIdCommand : IRequest<Response<ApplicationUser>>
    {
        public string Id { get; set; }
        public class DeleteUserByIdCommandHandler : IRequestHandler<DeleteUserByIdCommand, Response<ApplicationUser>>
        {
            private readonly UserManager<ApplicationUser> _userManager;
            private readonly IdentityContext _context;
            public DeleteUserByIdCommandHandler(UserManager<ApplicationUser> userManager, IdentityContext context)
            {
                _userManager = userManager;
                _context = context;
            }
            public async Task<Response<ApplicationUser>> Handle(DeleteUserByIdCommand command, CancellationToken cancellationToken)
            {
                var user = await _userManager.FindByIdAsync(command.Id);
                if (user == null) throw new ApiException($"User Not Found.");
                await _context.Entry(user).Collection(x => x.RefreshTokens).LoadAsync(cancellationToken);
                _context.Set<RefreshToken>().RemoveRange(user.RefreshTokens);
                var result = await _userManager.DeleteAsync(user);
                if (!result.Succeeded) throw new ApiException("Không thể xóa tài khoản.");
                return new Response<ApplicationUser>(user);
            }
        }
    }
}
