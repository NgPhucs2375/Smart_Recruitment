namespace Application.DTOs.CV;
public class ParsedCvDto
{
    public ParsedThongTinLienHeDto ThongTinLienHe { get; set; }

    public List<ParsedHocVanDto> HocVan { get; set; } = new();

    public List<ParsedKinhNghiemDto> KinhNghiemLamViec { get; set; } = new();

    public List<ParsedDuAnDto> DuAn { get; set; } = new();

    public List<ParsedKyNangDto> KyNang { get; set; } = new();

    public List<ParsedChungChiDto> ChungChi { get; set; } = new();
}