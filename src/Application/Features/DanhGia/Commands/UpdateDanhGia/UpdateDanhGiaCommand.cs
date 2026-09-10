using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.DanhGia.Commands.UpdateDanhGia;

public class UpdateDanhGiaCommand : IRequest<Response<int>>
{
    public int Id { get; set; }

    public int DonUngTuyenId { get; set; }

    public string NoiDungPhanHoi { get; set; }

    public string KetLuan { get; set; }

    public DateTime? NgayPhanHoi { get; set; }
}

public class UpdateDanhGiaCommandHandler(
    IApplicationDbContext context)
    : IRequestHandler<UpdateDanhGiaCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        UpdateDanhGiaCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await context.DanhGias
            .FindAsync([request.Id], cancellationToken);

        if (entity == null)
        {
            return new Response<int>(
                "Không tìm thấy đánh giá.");
        }

        var donTonTai = await context.DonUngTuyens
            .AsNoTracking()
            .AnyAsync(
                x => x.Id == request.DonUngTuyenId,
                cancellationToken);

        if (!donTonTai)
        {
            return new Response<int>(
                "Không tìm thấy đơn ứng tuyển.");
        }

        var trungLap = await context.DanhGias
            .AsNoTracking()
            .AnyAsync(
                x => x.Id != request.Id &&
                     x.DonUngTuyenId == request.DonUngTuyenId,
                cancellationToken);

        if (trungLap)
        {
            return new Response<int>(
                "Đơn ứng tuyển này đã được đánh giá.");
        }

        entity.DonUngTuyenId = request.DonUngTuyenId;
        entity.NoiDungPhanHoi = request.NoiDungPhanHoi?.Trim();
        entity.KetLuan = request.KetLuan?.Trim();

        if (request.NgayPhanHoi.HasValue)
        {
            entity.NgayPhanHoi = request.NgayPhanHoi;
        }

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Cập nhật đánh giá thành công.");
    }
}
