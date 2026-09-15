namespace Application.DTOs.CV;
public class ConfirmCvImportDto
{
    public string TenFile { get; set; }

    public string? FileUrl { get; set; }

    public string? TemplateId { get; set; }

    public bool IsDefault { get; set; }

    public ParsedCvDto NoiDung { get; set; }
}