namespace Application.Features.CvTheme.Queries.SuggestCvThemes;

public class SuggestedCvThemeViewModel
{
    public string Slug { get; set; }
    public string Ten { get; set; }
    public string MoTaNgan { get; set; }
    public double Diem { get; set; }
    public string LyDo { get; set; }
    public string MatchingVersion { get; set; } = "theme-v1";
}
