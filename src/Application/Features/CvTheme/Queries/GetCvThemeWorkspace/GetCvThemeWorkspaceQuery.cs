using Application.DTOs.CV;
using Application.Exceptions;
using Application.Features.CVUngVien.Queries.GetCVUngVienById;
using Application.Features.CvTheme.Queries.SuggestCvThemes;
using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CvTheme.Queries.GetCvThemeWorkspace;

/// <summary>
/// Gói toàn bộ dữ liệu agent cần đọc từ DB trong một lần gọi: danh mục mẫu
/// render được + bản tóm tắt CV + phần suy đoán ngành/cấp độ của rule.
/// Nghiệp vụ chấm điểm vẫn ở CvThemeMatcher — query này chỉ cung cấp ngữ cảnh.
/// </summary>
public class GetCvThemeWorkspaceQuery : IRequest<Response<CvThemeWorkspaceViewModel>>
{
    public int? CvUngVienId { get; set; }
    public bool UseSavedCv { get; set; } = true;
    public string? ViTri { get; set; }
    public string? Nganh { get; set; }
    public string? CapBac { get; set; }
    public string? PhongCach { get; set; }
    public string[]? KyNang { get; set; }
}

public class GetCvThemeWorkspaceQueryHandler(IApplicationDbContext context, ICurrentNguoiDungService current, ISender sender)
    : IRequestHandler<GetCvThemeWorkspaceQuery, Response<CvThemeWorkspaceViewModel>>
{
    private const int TomTatMaxChars = 400;

    public async Task<Response<CvThemeWorkspaceViewModel>> Handle(GetCvThemeWorkspaceQuery request, CancellationToken ct)
    {
        var actor = await current.ResolveAsync();
        var owned = context.CVUngViens.AsNoTracking().Include(x => x.HoSoUngVien)
            .Where(x => !x.IsDaXoa && x.HoSoUngVien.NguoiDungId == actor.Id);
        var cv = request.CvUngVienId.HasValue
            ? await owned.FirstOrDefaultAsync(x => x.Id == request.CvUngVienId, ct)
            : request.UseSavedCv
                ? await owned.OrderByDescending(x => x.IsDefault).ThenByDescending(x => x.Id).FirstOrDefaultAsync(ct)
                : null;
        if (request.CvUngVienId.HasValue && cv == null) throw new ApiException("Không tìm thấy CV trong phạm vi của bạn.", 403);

        var themes = await context.CvThemes.AsNoTracking().Where(t => t.IsActive).ToListAsync(ct);
        var catalog = themes
            .Select(t => (theme: t, renderer: CvThemeMatcher.ResolveRenderer(t)))
            .Where(x => x.renderer is not null)
            .OrderBy(x => x.theme.ThuTu).ThenBy(x => x.theme.Slug, StringComparer.Ordinal)
            .Select(x => new CvThemeCatalogItemViewModel
            {
                Slug = x.theme.Slug, Ten = x.theme.Ten, MoTaNgan = x.theme.MoTaNgan, MoTa = x.theme.MoTa,
                NganhPhuHop = x.theme.NganhPhuHop, ViTriMucTieu = x.theme.ViTriMucTieu, CapBac = x.theme.CapBac,
                Tags = x.theme.Tags, PhongCach = x.theme.PhongCachThietKe, SoCot = x.renderer!.Columns,
                ThanThienATS = x.theme.ThanThienATS, KhuyenNghiSuDung = x.theme.KhuyenNghiSuDung,
                TranhSuDungKhi = x.theme.TranhSuDungKhi, MauSacChuDao = x.theme.MauSacChuDao,
                TuCauHinhTheme = string.IsNullOrWhiteSpace(x.theme.CauHinhJson) is false
                    && !CvThemeMatcher.Renderers.ContainsKey(x.theme.Slug ?? ""),
            })
            .ToList();

        var digest = await BuildDigestAsync(cv, request, actor.Id, ct);
        var position = FirstNonBlank(request.ViTri, digest.ViTriMucTieu);
        var industry = CvThemeMatcher.Industry(FirstNonBlank(request.Nganh, position));
        if (string.IsNullOrWhiteSpace(request.Nganh) && !CvThemeMatcher.IsKnownIndustry(industry)) industry = "";
        if (string.IsNullOrWhiteSpace(industry))
            industry = digest.KyNang.Select(k => CvThemeMatcher.Industry(k.Ten)).FirstOrDefault(CvThemeMatcher.IsKnownIndustry) ?? "";
        var level = string.IsNullOrWhiteSpace(request.CapBac) ? CvThemeMatcher.Level(position) : CvThemeMatcher.Level(request.CapBac);

        var missing = new List<string>();
        if (string.IsNullOrWhiteSpace(position)) missing.Add("vị trí mục tiêu");
        if (string.IsNullOrWhiteSpace(industry)) missing.Add("ngành mục tiêu");
        if (string.IsNullOrWhiteSpace(level)) missing.Add("cấp độ công việc mục tiêu");

        var workspace = new CvThemeWorkspaceViewModel
        {
            Catalog = catalog,
            Cv = digest,
            NganhSuyDuoc = NullIfBlank(industry),
            CapBacSuyDuoc = NullIfBlank(level),
            PhongCachYeuCau = NullIfBlank(CvThemeMatcher.Style(request.PhongCach)),
            ThieuTieuChi = missing,
        };
        var guide = $"{workspace.Catalog.Count} mẫu đang bật và render được. Chọn trong Catalog, không tự đặt slug."
            + (missing.Count > 0 ? $" Chưa xác định được {string.Join(", ", missing)} — nêu rõ là suy đoán khi trình bày." : "");
        return new Response<CvThemeWorkspaceViewModel>(workspace, guide);
    }

    private async Task<CvThemeCvDigestViewModel> BuildDigestAsync(Domain.Entities.CVUngVien? cv, GetCvThemeWorkspaceQuery request, int actorId, CancellationToken ct)
    {
        var digest = new CvThemeCvDigestViewModel();
        if (cv is null)
        {
            digest.ViTriMucTieu = NullIfBlank(await context.HoSoUngViens.AsNoTracking()
                .Where(h => h.NguoiDungId == actorId).Select(h => h.ViTriUngTuyen).FirstOrDefaultAsync(ct));
            digest.KyNang = (request.KyNang ?? []).Select(s => (s ?? "").Trim()).Where(s => s.Length > 0).Distinct()
                .Select(s => new CvThemeSkillViewModel { Ten = s }).ToList();
            return digest;
        }

        var detail = await sender.Send(new GetCVUngVienByIdQuery { Id = cv.Id }, ct);
        ParsedCvDto? parsed = detail.Data?.NoiDung;
        digest.CvId = cv.Id;
        digest.TenFile = cv.TenFile;
        digest.TemplateHienTai = NullIfBlank(cv.TemplateId);
        digest.TemplateDaTungDung = await context.CVUngViens.AsNoTracking()
            .Where(x => !x.IsDaXoa && x.HoSoUngVien.NguoiDungId == actorId && x.TemplateId != "" && x.TemplateId != null)
            .Select(x => x.TemplateId).Distinct().Take(20).ToListAsync(ct);

        var contact = parsed?.ThongTinLienHe;
        digest.ViTriMucTieu = FirstNonBlank(request.ViTri, contact?.ViTriUngTuyen, cv.HoSoUngVien?.ViTriUngTuyen);
        digest.TomTat = Trim(contact?.GioiThieuBanThan, TomTatMaxChars);
        digest.CoAvatar = !string.IsNullOrWhiteSpace(contact?.AnhDaiDienUrl);

        var skills = (parsed?.KyNang ?? []).Select(k => new CvThemeSkillViewModel
        {
            Ten = (k.TenKyNang ?? "").Trim(), MucDo = k.MucDoThanhThao, SoNam = k.SoNamKinhNghiem,
        }).Where(k => k.Ten.Length > 0).ToList();
        foreach (var extra in (request.KyNang ?? []).Select(s => (s ?? "").Trim()).Where(s => s.Length > 0)
                     .Where(s => skills.All(k => !string.Equals(k.Ten, s, StringComparison.OrdinalIgnoreCase))))
            skills.Add(new CvThemeSkillViewModel { Ten = extra });
        digest.KyNang = skills.Take(100).ToList();
        digest.SoNamKyNangCaoNhat = skills.Count == 0 ? null : skills.Max(k => k.SoNam ?? 0f);

        digest.KinhNghiem = (parsed?.KinhNghiemLamViec ?? []).Select(x => new CvThemeExperienceViewModel
        {
            ChucDanh = NullIfBlank(x.ChucDanh), CongTy = NullIfBlank(x.TenCongTy),
            TuNgay = NullIfBlank(x.TuNgay), DenNgay = NullIfBlank(x.DenNgay), DenNay = x.IsHienTai,
            KyNangSuDung = (x.KyNangSuDung ?? []).Select(k => (k.TenKyNang ?? "").Trim()).Where(t => t.Length > 0).Distinct().Take(20).ToArray(),
        }).ToList();

        digest.HocVan = (parsed?.HocVan ?? []).Select(h => new CvThemeEducationViewModel
        {
            BangCap = NullIfBlank(h.BangCap), ChuyenNganh = NullIfBlank(h.ChuyenNganh),
            Truong = NullIfBlank(h.Truong), DenNgay = NullIfBlank(h.DenNgay),
        }).ToList();

        digest.DuAn = (parsed?.DuAn ?? []).Select(p => new CvThemeProjectViewModel
        {
            Ten = NullIfBlank(p.TenDuAn), VaiTro = NullIfBlank(p.VaiTro),
            CongNghe = (p.CongNghe ?? []).Select(c => (c.TenKyNang ?? "").Trim()).Where(t => t.Length > 0).Distinct().Take(20).ToArray(),
        }).ToList();
        digest.CoDuAn = digest.DuAn.Count > 0;

        digest.ChungChi = (parsed?.ChungChi ?? []).Select(c => (c.TenChungChi ?? "").Trim()).Where(t => t.Length > 0).Take(20).ToList();
        digest.CoChungChi = digest.ChungChi.Count > 0;
        return digest;
    }

    private static string? FirstNonBlank(params string?[] values) =>
        values.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v))?.Trim();

    private static string? NullIfBlank(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string? Trim(string? value, int max)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        value = value.Trim();
        return value.Length <= max ? value : value[..max] + "…";
    }
}
