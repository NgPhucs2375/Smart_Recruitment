using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using HoSoNhaTuyenDungEntity = global::Domain.Entities.HoSoNhaTuyenDung;

namespace Application.Features.HoSoNhaTuyenDung.Commands.CreateHoSoNhaTuyenDung;

public class CreateHoSoNhaTuyenDungCommand : IRequest<Response<int>>
{
    public int NguoiDungId { get; set; }

    public int DoanhNghiepId { get; set; }

    public string HoTen { get; set; }

    public string SDT { get; set; }

    public string ChucVu { get; set; }
}

public class CreateHoSoNhaTuyenDungCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<CreateHoSoNhaTuyenDungCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        CreateHoSoNhaTuyenDungCommand request,
        CancellationToken cancellationToken)
    {
        var ctx = await current.ResolveAsync();

        var doanhNghiep = await context.DoanhNghieps
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == request.DoanhNghiepId,
                cancellationToken);

        if (doanhNghiep == null)
        {
            return new Response<int>(
                "Doanh nghiệp không tồn tại.");
        }

        var nguoiDung = await context.NguoiDungs
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == request.NguoiDungId,
                cancellationToken);

        if (nguoiDung == null)
        {
            return new Response<int>(
                "Người dùng không tồn tại.");
        }

        // Chỉ Admin hoặc Người đại diện mới được tạo hồ sơ
        // nhà tuyển dụng cho doanh nghiệp.
        if (ctx.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN &&
            ctx.VaiTro != VaiTroNguoiDung.NGUOI_DAI_DIEN)
        {
            return new Response<int>(
                "Bạn không có quyền tạo hồ sơ nhà tuyển dụng.");
        }

        // Người đại diện chỉ được thao tác doanh nghiệp của mình.
        if (ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN &&
            doanhNghiep.NguoiDaiDienId != ctx.Id)
        {
            return new Response<int>(
                "Bạn không có quyền thao tác trên doanh nghiệp này.");
        }

        // Chỉ cho phép tạo hồ sơ cho Người đại diện hoặc Nhân sự.
        if (nguoiDung.VaiTro != VaiTroNguoiDung.NGUOI_DAI_DIEN &&
            nguoiDung.VaiTro != VaiTroNguoiDung.NHAN_SU)
        {
            return new Response<int>(
                "Người dùng không thuộc nhóm nhà tuyển dụng.");
        }

        // Nếu tạo hồ sơ cho Người đại diện,
        // phải đúng chính người đại diện của doanh nghiệp.
        if (nguoiDung.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN &&
            doanhNghiep.NguoiDaiDienId != nguoiDung.Id)
        {
            return new Response<int>(
                "Người dùng không phải người đại diện của doanh nghiệp này.");
        }

        // Tránh một user có nhiều hồ sơ trong cùng doanh nghiệp.
        var daTonTai = await context.HoSoNhaTuyenDungs
            .AsNoTracking()
            .AnyAsync(
                x => x.NguoiDungId == request.NguoiDungId &&
                     x.DoanhNghiepId == request.DoanhNghiepId,
                cancellationToken);

        if (daTonTai)
        {
            return new Response<int>(
                "Người dùng đã có hồ sơ trong doanh nghiệp này.");
        }

        var entity = new HoSoNhaTuyenDungEntity
        {
            NguoiDungId = request.NguoiDungId,
            DoanhNghiepId = request.DoanhNghiepId,
            HoTen = request.HoTen?.Trim(),
            SDT = request.SDT?.Trim(),
            ChucVu = request.ChucVu?.Trim()
        };

        await context.HoSoNhaTuyenDungs.AddAsync(
            entity,
            cancellationToken);

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Tạo hồ sơ nhà tuyển dụng thành công.");
    }
}