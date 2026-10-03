using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;
using CvThemeEntity = global::Domain.Entities.CvTheme;

namespace Application.Features.CvTheme.Commands.CreateCvTheme;

public class CreateCvThemeCommand : IRequest<Response<int>>
{
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

public class CreateCvThemeCommandHandler(
    IApplicationDbContext context)
    : IRequestHandler<CreateCvThemeCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        CreateCvThemeCommand request,
        CancellationToken cancellationToken)
    {
        var slug = request.Slug?.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(slug) || string.IsNullOrWhiteSpace(request.Ten))
        {
            return new Response<int>(
                "Slug và tên theme là bắt buộc.");
        }

        var daTonTai = await context.CvThemes
            .AsNoTracking()
            .AnyAsync(
                x => x.Slug.ToLower() == slug,
                cancellationToken);

        if (daTonTai)
        {
            return new Response<int>(
                "Slug theme đã tồn tại.");
        }

        var entity = new CvThemeEntity
        {
            Slug = slug,
            Ten = request.Ten.Trim(),
            MoTa = request.MoTa?.Trim(),
            MoTaNgan = request.MoTaNgan?.Trim(),
            DanhMuc = request.DanhMuc?.Trim(),
            NganhPhuHop = request.NganhPhuHop?.Trim(),
            ViTriMucTieu = request.ViTriMucTieu?.Trim(),
            CapBac = request.CapBac?.Trim(),
            Tags = request.Tags?.Trim(),
            PhongCachThietKe = request.PhongCachThietKe?.Trim(),
            SoCot = request.SoCot,
            ThanThienATS = request.ThanThienATS,
            MauSacChuDao = request.MauSacChuDao?.Trim(),
            TamLyMauSac = request.TamLyMauSac?.Trim(),
            KhuyenNghiSuDung = request.KhuyenNghiSuDung?.Trim(),
            TranhSuDungKhi = request.TranhSuDungKhi?.Trim(),
            GoiYAI = request.GoiYAI?.Trim(),
            LaMacDinh = request.LaMacDinh,
            IsActive = request.IsActive,
            ThuTu = request.ThuTu
        };

        await context.CvThemes.AddAsync(
            entity,
            cancellationToken);

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Tạo theme CV thành công.");
    }
}
