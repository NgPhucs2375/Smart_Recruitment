using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using Domain.Enums;
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
    public PhuongThucTaoCV PhuongThucTaoCV { get; set; }
    public TrangThaiTienTrinhCV TrangThaiTienTrinhCV { get; set; }
    public TrangThaiCV TrangThaiCV { get; set; }
    public string LoiChiTiet { get; set; }
    
}

public class CreateCVUngVienCommandHandler : IRequestHandler<CreateCVUngVienCommand, Response<int>>
{
    private readonly IApplicationDbContext _context;

    public CreateCVUngVienCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Response<int>> Handle(CreateCVUngVienCommand request, CancellationToken cancellationToken)
    {
        // check có tồn tại không đã
        if (!await _context.HoSoUngViens.AnyAsync(x =>
            x.Id == request.HoSoUngVienId, 
            cancellationToken))
        return new Response<int>("Không tìm thấy hồ sơ ứng viên.");
        
        // tạo
        var entity = new CVUngVienEntity { 
            HoSoUngVienId = request.HoSoUngVienId, 
            TenFile = request.TenFile, 
            FileUrl = request.FileUrl, 
            NgayUpload = request.NgayUpload ?? DateTime.UtcNow, 
            IsDefault = request.IsDefault,
            PhuongThucTaoCV = request.PhuongThucTaoCV,
            TrangThaiTienTrinhCV = request.TrangThaiTienTrinhCV,
            TrangThaiCV = request.TrangThaiCV
            };

        await _context.CVUngViens.AddAsync(entity, cancellationToken); 
        await _context.SaveChangesAsync(cancellationToken);

        return new Response<int>(data: entity.Id, message: "Tạo CV thành công.");
    }
}
