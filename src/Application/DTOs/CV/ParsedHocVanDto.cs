namespace Application.DTOs.CV;
public class ParsedHocVanDto
{
    public string? Truong { get; set; }

    public string? ChuyenNganh { get; set; }

    public string? BangCap { get; set; }

    // MM-YYYY
    public string? TuNgay { get; set; }

    // MM-YYYY
    public string? DenNgay { get; set; }

    public bool IsHienTai { get; set; }

    public string? MoTa { get; set; }

    public int ThuTu { get; set; }
}