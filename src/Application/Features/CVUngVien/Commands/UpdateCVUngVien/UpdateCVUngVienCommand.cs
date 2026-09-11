using System.Text.Json;
using Application.DTOs.CV;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CVUngVien.Commands.UpdateCVUngVien;

public class UpdateCVUngVienCommand : IRequest<Response<int>>
{
    public int Id { get; set; }
    public string TenFile { get; set; }
    public string TemplateId { get; set; }
    public bool IsDefault { get; set; }
    public PhuongThucTaoCV PhuongThucTao { get; set; }
    public NoiDungCVDto NoiDung { get; set; }
}

public class UpdateCVUngVienCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<UpdateCVUngVienCommand, Response<int>>
{
    public async Task<Response<int>> Handle(UpdateCVUngVienCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.CVUngViens
            .AsTracking()
            .FirstOrDefaultAsync(x => x.Id == request.Id && !x.IsDaXoa, cancellationToken);
        if (entity == null) return new Response<int>("Không tìm thấy CV.");

        var ctx = await current.ResolveAsync();
        if (ctx.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN)
        {
            var isOwner = await context.HoSoUngViens
                .AnyAsync(x => x.Id == entity.HoSoUngVienId && x.NguoiDungId == ctx.Id, cancellationToken);
            if (!isOwner) return new Response<int>("Bạn không có quyền thao tác trên CV này.");
        }

        if (request.NoiDung == null)
        {
            return new Response<int>("Nội dung CV không được để trống.");
        }

        if (!string.IsNullOrWhiteSpace(request.TenFile))
        {
            entity.TenFile = request.TenFile.Trim();
        }

        entity.TemplateId = request.TemplateId?.Trim();
        entity.PhuongThucTao = request.PhuongThucTao;
        entity.NoiDungJson = JsonSerializer.Serialize(request.NoiDung, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        });

        if (request.IsDefault && !entity.IsDefault)
        {
            var others = await context.CVUngViens
                .AsTracking()
                .Where(x => x.HoSoUngVienId == entity.HoSoUngVienId && x.Id != entity.Id && x.IsDefault)
                .ToListAsync(cancellationToken);
            foreach (var o in others) o.IsDefault = false;
            entity.IsDefault = true;
        }
        else if (!request.IsDefault)
        {
            entity.IsDefault = false;
        }

        await context.SaveChangesAsync(cancellationToken);
        return new Response<int>(data: entity.Id, message: "Cập nhật CV thành công.");
    }
}
