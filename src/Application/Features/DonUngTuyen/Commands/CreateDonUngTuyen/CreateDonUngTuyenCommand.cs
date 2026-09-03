using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using DonUngTuyenEntity = global::Domain.Entities.DonUngTuyen;

namespace Application.Features.DonUngTuyen.Commands.CreateDonUngTuyen;

public class CreateDonUngTuyenCommand : IRequest<Response<int>>
{
    public int HoSoUngVienId { get; set; }
    public int TinTuyenDungId { get; set; }
    public int CVUngVienId { get; set; }
}

public class CreateDonUngTuyenCommandHandler(IApplicationDbContext context) 
    : IRequestHandler<CreateDonUngTuyenCommand, Response<int>>
{
    public async Task<Response<int>> Handle(CreateDonUngTuyenCommand request, CancellationToken cancellationToken)
    {
        var cv = await context.CVUngViens
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.CVUngVienId, cancellationToken);

        var job = await context.TinTuyenDungs
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.TinTuyenDungId, cancellationToken);

        if (cv == null || job == null || !await context.HoSoUngViens.AnyAsync(x => x.Id == request.HoSoUngVienId, cancellationToken))
        {
            return new Response<int>("Ứng viên, tin tuyển dụng hoặc CV không tồn tại.");
        }

        if (cv.HoSoUngVienId != request.HoSoUngVienId)
        {
            return new Response<int>("CV không thuộc về ứng viên.");
        }

        if (job.TrangThai != TrangThaiTinTuyenDung.HIEN_THI)
        {
            return new Response<int>("Tin tuyển dụng không còn nhận hồ sơ.");
        }

        if (await context.DonUngTuyens.AnyAsync(x => x.HoSoUngVienId == request.HoSoUngVienId && x.TinTuyenDungId == request.TinTuyenDungId, cancellationToken))
        {
            return new Response<int>("Ứng viên đã nộp đơn cho tin này.");
        }

        var entity = new DonUngTuyenEntity
        {
            HoSoUngVienId = request.HoSoUngVienId,
            TinTuyenDungId = request.TinTuyenDungId,
            CVUngVienId = request.CVUngVienId,
            TrangThai = TrangThaiDonUngTuyen.DA_NOP,
            NgayUngTuyen = DateTime.UtcNow
        };

        await context.DonUngTuyens.AddAsync(entity, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return new Response<int>(data: entity.Id, message: "Nộp đơn ứng tuyển thành công.");
    }
}