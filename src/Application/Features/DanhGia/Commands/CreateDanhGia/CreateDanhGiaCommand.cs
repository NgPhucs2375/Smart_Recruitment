using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using DanhGiaEntity = global::Domain.Entities.DanhGia;

namespace Application.Features.DanhGia.Commands.CreateDanhGia;

public class CreateDanhGiaCommand : IRequest<Response<int>>
{
    public int DonUngTuyenId { get; set; }
    public string NoiDungPhanHoi { get; set; }
    public string KetLuan { get; set; }
    public DateTime? NgayPhanHoi { get; set; }
}

public class CreateDanhGiaCommandHandler(IApplicationDbContext context) : IRequestHandler<CreateDanhGiaCommand, Response<int>>
{
    public async Task<Response<int>> Handle(CreateDanhGiaCommand request, CancellationToken cancellationToken)
    {
        if (!await context.DonUngTuyens.AnyAsync(x => x.Id == request.DonUngTuyenId, cancellationToken)) return new Response<int>("Không tìm thấy đơn ứng tuyển.");
        var entity = new DanhGiaEntity { DonUngTuyenId = request.DonUngTuyenId, NoiDungPhanHoi = request.NoiDungPhanHoi, KetLuan = request.KetLuan, NgayPhanHoi = request.NgayPhanHoi ?? DateTime.UtcNow };
        await context.DanhGias.AddAsync(entity, cancellationToken); await context.SaveChangesAsync(cancellationToken);
        return new Response<int>(data: entity.Id, message: "Tạo đánh giá thành công.");
    }
}
