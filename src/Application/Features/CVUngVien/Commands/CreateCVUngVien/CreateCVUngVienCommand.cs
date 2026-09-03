using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using CVUngVienEntity = global::Domain.Entities.CVUngVien;

namespace Application.Features.CVUngVien.Commands.CreateCVUngVien;

public class CreateCVUngVienCommand : IRequest<Response<int>>
{
    public int HoSoUngVienId { get; set; }
    public string TenFile { get; set; }
    public string FileUrl { get; set; }
    public DateTime? NgayUpload { get; set; }
    public bool IsDefault { get; set; } = true;
}

public class CreateCVUngVienCommandHandler(IApplicationDbContext context) : IRequestHandler<CreateCVUngVienCommand, Response<int>>
{
    public async Task<Response<int>> Handle(CreateCVUngVienCommand request, CancellationToken cancellationToken)
    {
        if (!await context.HoSoUngViens.AnyAsync(x => x.Id == request.HoSoUngVienId, cancellationToken)) return new Response<int>("Không tìm thấy hồ sơ ứng viên.");
        var entity = new CVUngVienEntity { HoSoUngVienId = request.HoSoUngVienId, TenFile = request.TenFile, FileUrl = request.FileUrl, NgayUpload = request.NgayUpload ?? DateTime.UtcNow, IsDefault = request.IsDefault };
        await context.CVUngViens.AddAsync(entity, cancellationToken); await context.SaveChangesAsync(cancellationToken);
        return new Response<int>(data: entity.Id, message: "Tạo CV thành công.");
    }
}
