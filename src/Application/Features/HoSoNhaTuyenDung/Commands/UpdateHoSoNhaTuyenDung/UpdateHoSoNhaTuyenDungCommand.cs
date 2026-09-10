using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.HoSoNhaTuyenDung.Commands.UpdateHoSoNhaTuyenDung;

public class UpdateHoSoNhaTuyenDungCommand : IRequest<Response<int>>
{
    public int Id { get; set; }

    public int NguoiDungId { get; set; }

    public int DoanhNghiepId { get; set; }

    public string HoTen { get; set; }

    public string SDT { get; set; }

    public string ChucVu { get; set; }
}

public class UpdateHoSoNhaTuyenDungCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<UpdateHoSoNhaTuyenDungCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        UpdateHoSoNhaTuyenDungCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await context.HoSoNhaTuyenDungs
            .FindAsync([request.Id], cancellationToken);

        if (entity == null)
        {
            return new Response<int>(
                "Không tìm thấy hồ sơ nhà tuyển dụng.");
        }

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

        // Chỉ Admin hoặc Người đại diện mới được cập nhật hồ sơ
        // nhà tuyển dụng cho doanh nghiệp.
        if (ctx.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN &&
            ctx.VaiTro != VaiTroNguoiDung.NGUOI_DAI_DIEN)
        {
            return new Response<int>(
                "Bạn không có quyền cập nhật hồ sơ nhà tuyển dụng.");
        }

        // Người đại diện chỉ được thao tác doanh nghiệp của mình.
        if (ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN &&
            doanhNghiep.NguoiDaiDienId != ctx.Id)
        {
            return new Response<int>(
                "Bạn không có quyền thao tác trên doanh nghiệp này.");
        }

        // Chỉ cho phép hồ sơ của Người đại diện hoặc Nhân sự.
        if (nguoiDung.VaiTro != VaiTroNguoiDung.NGUOI_DAI_DIEN &&
            nguoiDung.VaiTro != VaiTroNguoiDung.NHAN_SU)
        {
            return new Response<int>(
                "Người dùng không thuộc nhóm nhà tuyển dụng.");
        }

        // Nếu là Người đại diện, phải đúng owner của doanh nghiệp.
        if (nguoiDung.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN &&
            doanhNghiep.NguoiDaiDienId != nguoiDung.Id)
        {
            return new Response<int>(
                "Người dùng không phải người đại diện của doanh nghiệp này.");
        }

        // Tránh một user có nhiều hồ sơ trong cùng doanh nghiệp.
        var trungLap = await context.HoSoNhaTuyenDungs
            .AsNoTracking()
            .AnyAsync(
                x => x.Id != request.Id &&
                     x.NguoiDungId == request.NguoiDungId &&
                     x.DoanhNghiepId == request.DoanhNghiepId,
                cancellationToken);

        if (trungLap)
        {
            return new Response<int>(
                "Người dùng đã có hồ sơ trong doanh nghiệp này.");
        }

        entity.NguoiDungId = request.NguoiDungId;
        entity.DoanhNghiepId = request.DoanhNghiepId;
        entity.HoTen = request.HoTen?.Trim();
        entity.SDT = request.SDT?.Trim();
        entity.ChucVu = request.ChucVu?.Trim();

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Cập nhật hồ sơ nhà tuyển dụng thành công.");
    }
}
