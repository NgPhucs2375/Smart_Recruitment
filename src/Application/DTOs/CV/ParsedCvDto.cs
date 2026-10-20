using System.Text.Json;

namespace Application.DTOs.CV;
public class ParsedCvDto
{
    public ParsedThongTinLienHeDto ThongTinLienHe { get; set; }

    public List<ParsedHocVanDto> HocVan { get; set; } = new();

    public List<ParsedKinhNghiemDto> KinhNghiemLamViec { get; set; } = new();

    public List<ParsedDuAnDto> DuAn { get; set; } = new();

    public List<ParsedKyNangDto> KyNang { get; set; } = new();

    public List<ParsedChungChiDto> ChungChi { get; set; } = new();

    /// <summary>
    /// Delta tùy biến giao diện theme Studio (JSON tùy ý). JsonElement để giữ
    /// nguyên cấu trúc FE gửi lên; null = không tùy biến.
    /// </summary>
    public JsonElement? GiaoDien { get; set; }
}