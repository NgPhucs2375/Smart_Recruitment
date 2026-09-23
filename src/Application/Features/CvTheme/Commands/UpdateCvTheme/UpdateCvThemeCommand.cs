using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CvTheme.Commands.UpdateCvTheme;

public class UpdateCvThemeCommand : IRequest<Response<int>>
{
    public int Id { get; set; }
    public string Slug { get; set; }
    public string Ten { get; set; }
    public string MoTa { get; set; }
    public string MoTaNgan { get; set; }
    public string DanhMuc { get; set; }
    public string NganhPhuHop { get; set; }
    public string ViTriMucTieu { get; set; }
    public string CapBac { get; set; }
    public string Tags { get; set; }
    public string PhongCachThietKe { get; set; }
    public int SoCot { get; set; } = 1;
    public bool ThanThienATS { get; set; } = true;
    public string MauSacChuDao { get; set; }
    public string TamLyMauSac { get; set; }
    public string KhuyenNghiSuDung { get; set; }
    public string TranhSuDungKhi { get; set; }
    public string GoiYAI { get; set; }
    public bool LaMacDinh { get; set; }
    public bool IsActive { get; set; } = true;
    public int ThuTu { get; set; }
}

public class UpdateCvThemeCommandHandler(
    IApplicationDbContext context)
    : IRequestHandler<UpdateCvThemeCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        UpdateCvThemeCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await context.CvThemes
            .FindAsync([request.Id], cancellationToken);

        if (entity == null)
        {
            return new Response<int>(
                "Không tìm thấy theme CV.");
        }

        // DbContext NoTracking toàn cục: Find/FirstOrDefault trả về entity
        // không track — Attach cùng reference (không throw duplicate-track).
        context.CvThemes.Attach(entity);

        var slug = request.Slug?.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(slug) || string.IsNullOrWhiteSpace(request.Ten))
        {
            return new Response<int>(
                "Slug và tên theme là bắt buộc.");
        }

        var trungLap = await context.CvThemes
            .AsNoTracking()
            .AnyAsync(
                x => x.Id != request.Id &&
                     x.Slug.ToLower() == slug,
                cancellationToken);

        if (trungLap)
        {
            return new Response<int>(
                "Slug theme đã tồn tại.");
        }

        entity.Slug = slug;
        entity.Ten = request.Ten.Trim();
        entity.MoTa = request.MoTa?.Trim();
        entity.MoTaNgan = request.MoTaNgan?.Trim();
        entity.DanhMuc = request.DanhMuc?.Trim();
        entity.NganhPhuHop = request.NganhPhuHop?.Trim();
        entity.ViTriMucTieu = request.ViTriMucTieu?.Trim();
        entity.CapBac = request.CapBac?.Trim();
        entity.Tags = request.Tags?.Trim();
        entity.PhongCachThietKe = request.PhongCachThietKe?.Trim();
        entity.SoCot = request.SoCot;
        entity.ThanThienATS = request.ThanThienATS;
        entity.MauSacChuDao = request.MauSacChuDao?.Trim();
        entity.TamLyMauSac = request.TamLyMauSac?.Trim();
        entity.KhuyenNghiSuDung = request.KhuyenNghiSuDung?.Trim();
        entity.TranhSuDungKhi = request.TranhSuDungKhi?.Trim();
        entity.GoiYAI = request.GoiYAI?.Trim();
        entity.LaMacDinh = request.LaMacDinh;
        entity.IsActive = request.IsActive;
        entity.ThuTu = request.ThuTu;

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Cập nhật theme CV thành công.");
    }
}
