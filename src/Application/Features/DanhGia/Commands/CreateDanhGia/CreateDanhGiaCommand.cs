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

        // Cùng chuẩn poster-scope với xem/sửa/xóa đánh giá
        // (ScopeReviews / EnsureApplicationReviewerAsync): Nhân sự chỉ
        // đánh giá đơn thuộc tin mình đăng, Người đại diện chỉ đánh giá
        // đơn thuộc doanh nghiệp mình. HR khác tin dù cùng công ty cũng
        // không tạo được, tránh review "dead-end" (tạo xong không xem,
        // sửa, xóa được, lại chặn người phụ trách tạo review đúng).
        await Application.Security.ResourceAccess.EnsureApplicationReviewerAsync(
            context, ctx, request.DonUngTuyenId, cancellationToken);

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

        try
        {
            await context.SaveChangesAsync(
                cancellationToken);
        }
        catch (DbUpdateException)
        {
            // Race với request song song: check-then-insert ở trên qua được
            // nhưng unique index (DonUngTuyenId) chặn ở DB — trả cùng message.
            return new Response<int>(
                "Đơn ứng tuyển này đã được đánh giá.");
        }

        return new Response<int>(
            data: entity.Id,
            message: "Tạo đánh giá thành công.");
    }
}