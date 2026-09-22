namespace Application.DTOs.CV;
public class ParsedDuAnDto
{
    public string? TenDuAn { get; set; }

    public string? VaiTro { get; set; }

    // YYYY-MM
    public string? TuNgay { get; set; }

    // YYYY-MM
    public string? DenNgay { get; set; }

    public bool IsHienTai { get; set; }

    public string? Link { get; set; }

    public string? MoTa { get; set; }

    public List<ParsedKyNangThamChieuDto> CongNghe { get; set; }
        = new();

    public int ThuTu { get; set; }
}