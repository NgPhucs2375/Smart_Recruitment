namespace Application.DTOs.CV;
public class ParsedCvResultDto
{
    public string TenFile { get; set; }

    public string LoaiFile { get; set; }

    public long KichThuocFile { get; set; }

    public ParsedCvDto NoiDung { get; set; }

    public List<CvParseWarningDto> CanhBao { get; set; } = new();
    public CvParseSectionConfidenceDto? Confidence { get; set; }

    public bool CanXacNhanThuCong { get; set; }
}