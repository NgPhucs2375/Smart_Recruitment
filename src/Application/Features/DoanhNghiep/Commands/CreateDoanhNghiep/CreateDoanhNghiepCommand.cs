using Application.Exceptions;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using DoanhNghiepEntity = global::Domain.Entities.DoanhNghiep;

namespace Application.Features.DoanhNghiep.Commands.CreateDoanhNghiep;

public class CreateDoanhNghiepCommand : IRequest<Response<int>>
{
    public string TenDoanhNghiep { get; set; }
    public string MoTa { get; set; }
    public string Website { get; set; }
    public string DiaChi { get; set; }
    public string LogoUrl { get; set; }
    public string MaSoThue { get; set; }
    public string LinhVucHoatDong { get; set; }
    public string QuyMoNhanSu { get; set; }
}

public class CreateDoanhNghiepCommandHandler(IApplicationDbContext context, ICurrentNguoiDungService current) : IRequestHandler<CreateDoanhNghiepCommand, Response<int>>
{
    public async Task<Response<int>> Handle(CreateDoanhNghiepCommand request, CancellationToken cancellationToken)
    {
        var ctx = await current.ResolveAsync();

        // Chỉ NGUOI_DAI_DIEN (tạo DN cho chính mình) và QUAN_TRI_VIEN được tạo DN.
        if (ctx.VaiTro != VaiTroNguoiDung.NGUOI_DAI_DIEN && ctx.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN)
            throw new ApiException("Bạn không có quyền tạo doanh nghiệp.", 403);

        // 1-1 nghiêm ngặt: mỗi NGUOI_DAI_DIEN chỉ sở hữu 1 DN.
        if (ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
        {
            if (ctx.DoanhNghiepId.HasValue)
                throw new ApiException("Mỗi người đại diện chỉ được sở hữu 1 doanh nghiệp.");
            if (await context.DoanhNghieps.AnyAsync(d => d.NguoiDaiDienId == ctx.Id, cancellationToken))
                throw new ApiException("Mỗi người đại diện chỉ được sở hữu 1 doanh nghiệp.");
        }

        if (!string.IsNullOrWhiteSpace(request.MaSoThue) &&
            await context.DoanhNghieps.AnyAsync(d => d.MaSoThue == request.MaSoThue.Trim(), cancellationToken))
            throw new ApiException($"Mã số thuế '{request.MaSoThue.Trim()}' đã được sử dụng.");

        var entity = new DoanhNghiepEntity
        {
            TenDoanhNghiep = request.TenDoanhNghiep?.Trim(),
            MoTa = request.MoTa?.Trim(),
            Website = request.Website?.Trim(),
            DiaChi = request.DiaChi?.Trim(),
            LogoUrl = request.LogoUrl?.Trim(),
            MaSoThue = request.MaSoThue?.Trim(),
            LinhVucHoatDong = request.LinhVucHoatDong?.Trim(),
            QuyMoNhanSu = request.QuyMoNhanSu?.Trim(),
            // NGUOI_DAI_DIEN tự tạo thì gán mình làm owner; ADMIN tạo hộ thì để null, gán sau.
            NguoiDaiDienId = ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN ? ctx.Id : null
        };
        await context.DoanhNghieps.AddAsync(entity, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        // Đồng bộ chiều ngược lại: tạo HoSoNhaTuyenDung để CurrentNguoiDungService.ResolveAsync thấy DoanhNghiepId.
        if (ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN &&
            !await context.HoSoNhaTuyenDungs.AnyAsync(h => h.NguoiDungId == ctx.Id, cancellationToken))
        {
            await context.HoSoNhaTuyenDungs.AddAsync(new Domain.Entities.HoSoNhaTuyenDung
            {
                NguoiDungId = ctx.Id,
                DoanhNghiepId = entity.Id,
                HoTen = request.TenDoanhNghiep,
                ChucVu = "Người đại diện"
            }, cancellationToken);
            await context.SaveChangesAsync(cancellationToken);
        }

        return new Response<int>(data: entity.Id, message: "Tạo doanh nghiệp thành công.");
    }
}
