using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Application.Wrappers;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Application.Exceptions;
using System.Linq;
using Infrastructure.Identity.Models;
using Domain.Enums;
using Application.Interfaces;

namespace Infrastructure.Identity.Features.Role.Commands.AssignRole
{
    public class AssignRoleCommand : IRequest<Response<string>>
    {
        public string UserId { get; set; }
        public string RoleName { get; set; }
    }

    public class AssignRoleCommandHandler : IRequestHandler<AssignRoleCommand, Response<string>>
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IApplicationDbContext _appContext;

        public AssignRoleCommandHandler(UserManager<ApplicationUser> userManager, IApplicationDbContext appContext)
        {
            _userManager = userManager;
            _appContext = appContext;
        }

        public async Task<Response<string>> Handle(AssignRoleCommand request, CancellationToken ct)
        {
            if (!Enum.TryParse<VaiTroNguoiDung>(request.RoleName, true, out var vaiTroEnum))
            {
                throw new ApiException($"Vai trò '{request.RoleName}' không hợp lệ trong hệ thống.");
            }

            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null)
            {
                throw new ApiException("Không tìm thấy người dùng.");
            }

            var result = await _userManager.AddToRoleAsync(user, request.RoleName);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new ApiException($"Gán vai trò thất bại: {errors}");
            }

            var nguoiDung = await _appContext.NguoiDungs
                .FirstOrDefaultAsync(x => x.ApplicationUserId == user.Id, ct);

            if (nguoiDung != null)
            {
                nguoiDung.VaiTro = vaiTroEnum;
                await _appContext.SaveChangesAsync(ct);
            }

            return new Response<string>(request.RoleName, $"Đã gán vai trò '{request.RoleName}' cho người dùng.");
        }
    }
}
