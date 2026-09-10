using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CVUngVien.Commands.UpdateCVUngVien;

public class UpdateCVUngVienCommand : IRequest<Response<int>>
{
    public int Id { get; set; }
    public int HoSoUngVienId { get; set; }
    public string TenFile { get; set; }
    public string FileUrl { get; set; }
    public DateTime? NgayUpload { get; set; }
    public bool IsDefault { get; set; }
}

public class UpdateCVUngVienCommandHandler(IApplicationDbContext context) : IRequestHandler<UpdateCVUngVienCommand, Response<int>>
{
    public async Task<Response<int>> Handle(UpdateCVUngVienCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.CVUngViens.FindAsync([request.Id], cancellationToken);
        if (entity == null) return new Response<int>("Không tìm thấy CV.");
        if (!await context.HoSoUngViens.AnyAsync(x => x.Id == request.HoSoUngVienId, cancellationToken)) return new Response<int>("Không tìm thấy hồ sơ ứng viên.");
        entity.HoSoUngVienId = request.HoSoUngVienId; entity.TenFile = request.TenFile; entity.FileUrl = request.FileUrl; entity.NgayUpload = request.NgayUpload ?? entity.NgayUpload; entity.IsDefault = request.IsDefault;
        await context.SaveChangesAsync(cancellationToken);
        return new Response<int>(data: entity.Id, message: "Cập nhật CV thành công.");
    }
}
