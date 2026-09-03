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

public class UpdateDanhGiaCommandHandler(IApplicationDbContext context) : IRequestHandler<UpdateDanhGiaCommand, Response<int>>
{
    public async Task<Response<int>> Handle(UpdateDanhGiaCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.DanhGias.FindAsync([request.Id], cancellationToken);
        if (entity == null) return new Response<int>("Không tìm thấy đánh giá.");
        if (!await context.DonUngTuyens.AnyAsync(x => x.Id == request.DonUngTuyenId, cancellationToken)) return new Response<int>("Không tìm thấy đơn ứng tuyển.");
        entity.DonUngTuyenId = request.DonUngTuyenId; entity.NoiDungPhanHoi = request.NoiDungPhanHoi; entity.KetLuan = request.KetLuan; entity.NgayPhanHoi = request.NgayPhanHoi ?? entity.NgayPhanHoi;
        await context.SaveChangesAsync(cancellationToken); return new Response<int>(data: entity.Id, message: "Cập nhật đánh giá thành công.");
    }
}
