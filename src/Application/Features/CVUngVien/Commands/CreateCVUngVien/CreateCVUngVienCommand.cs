using System.Text.Json;
using Application.DTOs.CV;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using CVUngVienEntity = global::Domain.Entities.CVUngVien;

namespace Application.Features.CVUngVien.Commands.CreateCVUngVien;

public class CreateCVUngVienCommand : IRequest<Response<int>>
{
    public int HoSoUngVienId { get; set; }
    public string TenFile { get; set; }
    public string TemplateId { get; set; }
    public bool IsDefault { get; set; } = true;
    public TaoCVThuCong NoiDung { get; set; }
}

public class CreateCVUngVienCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<CreateCVUngVienCommand, Response<int>>
{
    public async Task<Response<int>> Handle(CreateCVUngVienCommand request, CancellationToken cancellationToken)
    {
        var hoSo = await context.HoSoUngViens
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.HoSoUngVienId, cancellationToken);
        if (hoSo == null)
        {
            return new Response<int>("Hồ sơ ứng viên không tồn tại.");
        }

        var ctx = await current.ResolveAsync();
        if (ctx.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN && hoSo.NguoiDungId != ctx.Id)
        {
            return new Response<int>("Bạn không có quyền thao tác trên hồ sơ ứng viên này.");
        }

        if (request.NoiDung == null)
        {
            return new Response<int>("Nội dung CV không được để trống.");
        }

        var hasExisting = await context.CVUngViens
            .AnyAsync(x => x.HoSoUngVienId == request.HoSoUngVienId && !x.IsDaXoa, cancellationToken);

        // CV đầu tiên của hồ sơ luôn là mặc định.
        var isDefault = !hasExisting || request.IsDefault;
        if (isDefault && hasExisting)
        {
            var oldDefaults = await context.CVUngViens
                .AsTracking()
                .Where(x => x.HoSoUngVienId == request.HoSoUngVienId && x.IsDefault)
                .ToListAsync(cancellationToken);
            foreach (var cv in oldDefaults)
            {
                cv.IsDefault = false;
            }
        }

        var noiDungJson = JsonSerializer.Serialize(request.NoiDung, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        });

        // Nhánh thủ công không có state/vòng đời: FileUrl sinh sau ở bước export PDF.
        var entity = new CVUngVienEntity
        {
            HoSoUngVienId = request.HoSoUngVienId,
            TenFile = string.IsNullOrWhiteSpace(request.TenFile)
                ? $"CV-{DateTime.UtcNow:yyyyMMddHHmmss}"
                : request.TenFile.Trim(),
            FileUrl = null,
            NgayUpload = DateTime.UtcNow,
            IsDefault = isDefault,
            IsDaXoa = false,
            NoiDungJson = noiDungJson,
            TemplateId = request.TemplateId?.Trim()
        };

        await context.CVUngViens.AddAsync(entity, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return new Response<int>(data: entity.Id, message: "Tạo CV thành công.");
    }
}
