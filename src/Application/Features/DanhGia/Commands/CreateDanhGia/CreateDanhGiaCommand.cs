using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using DanhGiaEntity = global::Domain.Entities.DanhGia;

namespace Application.Features.DanhGia.Commands.CreateDanhGia;

public class CreateDanhGiaCommand : IRequest<Response<int>>
{
    public int DonUngTuyenId { get; set; }

    public string NoiDungPhanHoi { get; set; }

    public string KetLuan { get; set; }
}

public class CreateDanhGiaCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<CreateDanhGiaCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        CreateDanhGiaCommand request,
        CancellationToken cancellationToken)
    {
        var donUngTuyen = await context.DonUngTuyens
            .AsNoTracking()
            .Include(x => x.TinTuyenDung)
                .ThenInclude(x => x.DoanhNghiep)
            .FirstOrDefaultAsync(
                x => x.Id == request.DonUngTuyenId,
                cancellationToken);

        if (donUngTuyen == null)
        {
            return new Response<int>(
                "Không tìm thấy đơn ứng tuyển.");
        }

        if (donUngTuyen.TinTuyenDung == null ||
            donUngTuyen.TinTuyenDung.DoanhNghiep == null)
        {
            return new Response<int>(
                "Không xác định được doanh nghiệp của đơn ứng tuyển.");
        }

        var ctx = await current.ResolveAsync();

        // Chỉ Admin, Người đại diện và Nhân sự
        // mới được tạo đánh giá.
        if (ctx.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN &&
            ctx.VaiTro != VaiTroNguoiDung.NGUOI_DAI_DIEN &&
            ctx.VaiTro != VaiTroNguoiDung.NHAN_SU)
        {
            return new Response<int>(
                "Bạn không có quyền đánh giá ứng viên.");
        }

        var doanhNghiepId =
            donUngTuyen.TinTuyenDung.DoanhNghiepId;

        // Người đại diện chỉ được đánh giá đơn thuộc
        // doanh nghiệp mình sở hữu.
        if (ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
        {
            var nguoiDaiDienId =
                donUngTuyen.TinTuyenDung
                    .DoanhNghiep
                    .NguoiDaiDienId;

            if (!nguoiDaiDienId.HasValue ||
                nguoiDaiDienId.Value != ctx.Id)
            {
                return new Response<int>(
                    "Bạn không có quyền đánh giá đơn ứng tuyển này.");
            }
        }

        // Nhân sự phải thuộc đúng doanh nghiệp
        // đang quản lý tin tuyển dụng.
        if (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU)
        {
            var laNhanSuCuaDoanhNghiep =
                await context.HoSoNhaTuyenDungs
                    .AsNoTracking()
                    .AnyAsync(
                        x => x.NguoiDungId == ctx.Id &&
                             x.DoanhNghiepId == doanhNghiepId,
                        cancellationToken);

            if (!laNhanSuCuaDoanhNghiep)
            {
                return new Response<int>(
                    "Bạn không thuộc doanh nghiệp quản lý đơn ứng tuyển này.");
            }
        }

        // Một đơn ứng tuyển chỉ có một đánh giá.
        var daDanhGia = await context.DanhGias
            .AsNoTracking()
            .AnyAsync(
                x => x.DonUngTuyenId == request.DonUngTuyenId,
                cancellationToken);

        if (daDanhGia)
        {
            return new Response<int>(
                "Đơn ứng tuyển này đã được đánh giá.");
        }

        var entity = new DanhGiaEntity
        {
            DonUngTuyenId = request.DonUngTuyenId,
            NoiDungPhanHoi = request.NoiDungPhanHoi?.Trim(),
            KetLuan = request.KetLuan?.Trim(),
            NgayPhanHoi = DateTime.UtcNow
        };

        await context.DanhGias.AddAsync(
            entity,
            cancellationToken);

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Tạo đánh giá thành công.");
    }
}