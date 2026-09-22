namespace Application.DTOs.CV;
public class ParsedChungChiDto
{
    public string? TenChungChi { get; set; }

    public string? DonViCap { get; set; }

    // YYYY-MM-DD nếu CV cung cấp đủ
    public string? NgayCap { get; set; }

    public string? NgayHetHan { get; set; }

    public string? MaXacMinh { get; set; }

    public string? CredentialUrl { get; set; }

    public int ThuTu { get; set; }
}