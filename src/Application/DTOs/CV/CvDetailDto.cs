using Domain.Enums;

namespace Application.DTOs.CV;

public class CvDetailDto
{
    public int Id { get; set; }

    public string TenFile { get; set; }

    public string? FileUrl { get; set; }

    public DateTime? NgayUpload { get; set; }

    public string? TemplateId { get; set; }

    public bool IsDefault { get; set; }

    public PhuongThucTaoCV PhuongThucTao { get; set; }

    public ParsedCvDto NoiDung { get; set; }
}