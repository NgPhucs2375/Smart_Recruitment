namespace Application.DTOs.CV;
public class ParsedKinhNghiemDto
{
    public string? TenCongTy { get; set; }

    public string? ChucDanh { get; set; }

    public string? DiaChi { get; set; }

    // MM-YYYY
    public string? TuNgay { get; set; }

    // MM-YYYY
    public string? DenNgay { get; set; }

    public bool IsHienTai { get; set; }

    public string? MoTa { get; set; }

    public List<ParsedKyNangThamChieuDto> KyNangSuDung { get; set; }
        = new();

    public int ThuTu { get; set; }
}