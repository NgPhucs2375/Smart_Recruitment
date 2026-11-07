using Application.Features.CvTheme.Queries.SuggestCvThemes;
using Domain.Enums;

namespace Application.Features.CvTheme.Queries.GetCvThemeWorkspace;

/// <summary>
/// Một mẫu CV agent được phép chọn: row active và có renderer thật
/// (manifest tĩnh hoặc CauHinhJson ThemeCanvas).
/// </summary>
public class CvThemeCatalogItemViewModel
{
    public string Slug { get; set; } = "";
    public string Ten { get; set; } = "";
    public string? MoTaNgan { get; set; }
    public string? MoTa { get; set; }
    public string? NganhPhuHop { get; set; }
    public string? ViTriMucTieu { get; set; }
    public string? CapBac { get; set; }
    public string? Tags { get; set; }
    public string? PhongCach { get; set; }
    public int SoCot { get; set; }
    public bool ThanThienATS { get; set; }
    public string? KhuyenNghiSuDung { get; set; }
    public string? TranhSuDungKhi { get; set; }
    public string? MauSacChuDao { get; set; }
    /// <summary>True = ThemeCanvas vẽ từ CauHinhJson; false = renderer tĩnh trong manifest.</summary>
    public bool TuCauHinhTheme { get; set; }
}

public class CvThemeSkillViewModel
{
    public string Ten { get; set; } = "";
    public MucDo? MucDo { get; set; }
    public float? SoNam { get; set; }
}

public class CvThemeExperienceViewModel
{
    public string? ChucDanh { get; set; }
    public string? CongTy { get; set; }
    public string? TuNgay { get; set; }
    public string? DenNgay { get; set; }
    public bool DenNay { get; set; }
    public string[] KyNangSuDung { get; set; } = [];
}

public class CvThemeEducationViewModel
{
    public string? BangCap { get; set; }
    public string? ChuyenNganh { get; set; }
    public string? Truong { get; set; }
    public string? DenNgay { get; set; }
}

public class CvThemeProjectViewModel
{
    public string? Ten { get; set; }
    public string? VaiTro { get; set; }
    public string[] CongNghe { get; set; } = [];
}

/// <summary>Bản tóm tắt CV đủ để quyết định bố cục, không phải toàn văn CV.</summary>
public class CvThemeCvDigestViewModel
{
    public int? CvId { get; set; }
    public string? TenFile { get; set; }
    public string? ViTriMucTieu { get; set; }
    public string? TomTat { get; set; }
    public List<CvThemeSkillViewModel> KyNang { get; set; } = [];
    public List<CvThemeExperienceViewModel> KinhNghiem { get; set; } = [];
    public List<CvThemeEducationViewModel> HocVan { get; set; } = [];
    public List<CvThemeProjectViewModel> DuAn { get; set; } = [];
    public List<string> ChungChi { get; set; } = [];
    /// <summary>Số năm lớn nhất ghi trên kỹ năng; null khi CV không khai.</summary>
    public float? SoNamKyNangCaoNhat { get; set; }
    /// <summary>Slug mẫu CV đang dùng — preference hiện tại của user.</summary>
    public string? TemplateHienTai { get; set; }
    /// <summary>Slug mẫu trên các CV đã lưu khác — tín hiệu lặp lại, không phải nội dung.</summary>
    public List<string> TemplateDaTungDung { get; set; } = [];
    public bool CoAvatar { get; set; }
    public bool CoDuAn { get; set; }
    public bool CoChungChi { get; set; }
}

/// <summary>Toàn bộ những gì agent cần đọc từ DB để chọn mẫu: catalog + digest CV + suy đoán rule.</summary>
public class CvThemeWorkspaceViewModel
{
    public List<CvThemeCatalogItemViewModel> Catalog { get; set; } = [];
    public CvThemeCvDigestViewModel Cv { get; set; } = new();
    public string? NganhSuyDuoc { get; set; }
    public string? CapBacSuyDuoc { get; set; }
    public string? PhongCachYeuCau { get; set; }
    /// <summary>Tiêu chí chưa có dữ liệu — agent phải nói rõ là suy đoán.</summary>
    public List<string> ThieuTieuChi { get; set; } = [];
    public string MatchingVersion { get; set; } = CvThemeMatcher.Version;
}
