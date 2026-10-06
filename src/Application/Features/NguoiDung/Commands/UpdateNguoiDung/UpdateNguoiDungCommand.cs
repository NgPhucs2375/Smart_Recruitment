using Application.Exceptions;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.NguoiDung.Commands.UpdateNguoiDung;

public class UpdateNguoiDungCommand : IRequest<Response<int>>
{
    public int Id { get; set; }
    public string ApplicationUserId { get; set; }
    public VaiTroNguoiDung VaiTro { get; set; }
    public bool IsActive { get; set; }
}
public class UpdateNguoiDungCommandHandler(IApplicationDbContext context, ICurrentNguoiDungService current, IUserRoleService roles)
    : IRequestHandler<UpdateNguoiDungCommand, Response<int>>
{
    public async Task<Response<int>> Handle(UpdateNguoiDungCommand request, CancellationToken ct)
    {
        if ((await current.ResolveAsync()).VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN)
            throw new ApiException("Chỉ Admin được quản lý tài khoản và vai trò.", 403);
        var user = await context.NguoiDungs.AsNoTracking().SingleOrDefaultAsync(x => x.Id == request.Id, ct);
        if (user == null) return new Response<int>("Không tìm thấy người dùng.");
        if (request.ApplicationUserId != user.ApplicationUserId)
            throw new ApiException("Không được thay đổi tài khoản đăng nhập gắn với hồ sơ.");
        await roles.SetRoleAsync(user.ApplicationUserId, request.VaiTro, request.IsActive, ct);
        return new Response<int>(user.Id, "Đã đồng bộ vai trò và trạng thái tài khoản.");
    }
}
