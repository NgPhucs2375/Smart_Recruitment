using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Application.Wrappers;
using Microsoft.AspNetCore.Identity;
using Application.Exceptions;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Identity.Models;
using System.Linq;
using Application.Interfaces;

namespace Infrastructure.Identity.Features.Role.Commands.RemoveRole
{
    public class RemoveRoleCommand : IRequest<Response<string>>
    {
        public string UserId { get; set; }
        public string RoleName { get; set; }
    }

    public class RemoveRoleCommandHandler : IRequestHandler<RemoveRoleCommand, Response<string>>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IApplicationDbContext _appContext;

        public RemoveRoleCommandHandler(UserManager<ApplicationUser> userManager, IApplicationDbContext appContext)
        {
            _userManager = userManager;
            _appContext = appContext;
        }

        public async Task<Response<string>> Handle(RemoveRoleCommand request, CancellationToken ct)
        {
            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null)
            {
                throw new ApiException("Không tìm thấy người dùng.");
            }

            var result = await _userManager.RemoveFromRoleAsync(user, request.RoleName);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new ApiException($"Gỡ vai trò thất bại: {errors}");
            }

            var nguoiDung = await _appContext.NguoiDungs
                .FirstOrDefaultAsync(x => x.ApplicationUserId == user.Id, ct);

            if (nguoiDung != null)
            {
                var remainingRoles = await _userManager.GetRolesAsync(user);
                var nextValidRole = remainingRoles
                    .Select(r => Enum.TryParse<VaiTroNguoiDung>(r, true, out var v) ? (VaiTroNguoiDung?)v : null)
                    .FirstOrDefault(v => v.HasValue);

                if (nextValidRole.HasValue)
                {
                    nguoiDung.VaiTro = nextValidRole.Value;
                }

                await _appContext.SaveChangesAsync(ct);
            }

            return new Response<string>(request.RoleName, $"Đã gỡ vai trò '{request.RoleName}' khỏi người dùng.");
        }
    }
}
