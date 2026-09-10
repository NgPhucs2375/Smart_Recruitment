using Application.Exceptions;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.DoanhNghiep.Commands.UpdateDoanhNghiep;

public class UpdateDoanhNghiepCommand : IRequest<Response<int>>
{
    public int Id { get; set; }
    public string TenDoanhNghiep { get; set; }
    public string MoTa { get; set; }
    public string Website { get; set; }
    public string DiaChi { get; set; }
    public string LogoUrl { get; set; }
    public string MaSoThue { get; set; }
    public string LinhVucHoatDong { get; set; }
    public string QuyMoNhanSu { get; set; }
}

public class UpdateDoanhNghiepCommandHandler(IApplicationDbContext context, ICurrentNguoiDungService current) : IRequestHandler<UpdateDoanhNghiepCommand, Response<int>>
{
    public async Task<Response<int>> Handle(UpdateDoanhNghiepCommand request, CancellationToken cancellationToken)
    {
        var ctx = await current.ResolveAsync();

        var entity = await context.DoanhNghieps.AsTracking().FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
        if (entity == null) return new Response<int>("Không tìm thấy doanh nghiệp.");

        // Chỉ owner hoặc ADMIN được sửa. Không cho đổi owner qua API này (giữ 1-1).
        var isOwner = entity.NguoiDaiDienId.HasValue && entity.NguoiDaiDienId.Value == ctx.Id;
        var isAdmin = ctx.VaiTro == VaiTroNguoiDung.QUAN_TRI_VIEN;
        var isMemberViaHoSo = ctx.DoanhNghiepId.HasValue && ctx.DoanhNghiepId.Value == entity.Id &&
                              (ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN || ctx.VaiTro == VaiTroNguoiDung.NHAN_SU);
        if (!isOwner && !isAdmin && !isMemberViaHoSo)
            throw new ApiException("Bạn không có quyền cập nhật doanh nghiệp này.", 403);

        if (!string.IsNullOrWhiteSpace(request.MaSoThue) &&
            await context.DoanhNghieps.AnyAsync(d => d.Id != request.Id && d.MaSoThue == request.MaSoThue.Trim(), cancellationToken))
            throw new ApiException($"Mã số thuế '{request.MaSoThue.Trim()}' đã được sử dụng.");

        entity.TenDoanhNghiep = request.TenDoanhNghiep?.Trim();
        entity.MoTa = request.MoTa?.Trim();
        entity.Website = request.Website?.Trim();
        entity.DiaChi = request.DiaChi?.Trim();
        entity.LogoUrl = request.LogoUrl?.Trim();
        entity.MaSoThue = request.MaSoThue?.Trim();
        entity.LinhVucHoatDong = request.LinhVucHoatDong?.Trim();
        entity.QuyMoNhanSu = request.QuyMoNhanSu?.Trim();
        await context.SaveChangesAsync(cancellationToken);
        return new Response<int>(data: entity.Id, message: "Cập nhật doanh nghiệp thành công.");
    }
}
