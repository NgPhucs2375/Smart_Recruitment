namespace Application.Features.CvTheme.Queries.GetAllCvThemes;

public class GetAllCvThemesParameter
{
    public int _start { get; set; }
    public int _end { get; set; }
    public string _order { get; set; }
    public string _sort { get; set; }
    public string _filter { get; set; }
}

public class GetAllCvThemesViewModel
{
    public int Id { get; set; }
    public string Slug { get; set; }
    public string Ten { get; set; }
    public string MoTa { get; set; }
    public string MoTaNgan { get; set; }
    public string PreviewStorageKey { get; set; }
    public string DanhMuc { get; set; }
    public string NganhPhuHop { get; set; }
    public string ViTriMucTieu { get; set; }
    public string CapBac { get; set; }
    public string Tags { get; set; }
    public string PhongCachThietKe { get; set; }
    public int SoCot { get; set; }
    public bool ThanThienATS { get; set; }
    public string MauSacChuDao { get; set; }
    public string TamLyMauSac { get; set; }
    public string KhuyenNghiSuDung { get; set; }
    public string TranhSuDungKhi { get; set; }
    public string GoiYAI { get; set; }
    public bool LaMacDinh { get; set; }
    public bool IsActive { get; set; }
    public int ThuTu { get; set; }
    public string Version { get; set; } = "1.0";
}
