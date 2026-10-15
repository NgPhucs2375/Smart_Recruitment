namespace Application.Features.CvTheme.Queries.SuggestCvThemes;

public class SuggestedCvThemeViewModel
{
    public string Slug { get; set; }
    public string Ten { get; set; }
    public string MoTaNgan { get; set; }
    public double Diem { get; set; }
    public string LyDo { get; set; }
    public string MatchingVersion { get; set; } = "theme-v1";
    public List<string> CanhBao { get; set; } = new();
    public string Nganh { get; set; }
    public string ViTri { get; set; }
    public string CapBac { get; set; }
    public string PhongCach { get; set; }
    public int SoCot { get; set; }
    public string TemplateVersion { get; set; }
    public bool ThanThienATS { get; set; }
}
