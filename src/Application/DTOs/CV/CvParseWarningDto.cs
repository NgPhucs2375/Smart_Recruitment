namespace Application.DTOs.CV;
public class CvParseWarningDto
{
    public string Field { get; set; }

    public string Message { get; set; }

    public string? RawValue { get; set; }
}