#nullable enable
using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Application.Exceptions;
using Theme = Domain.Entities.CvTheme;

namespace Application.Features.CvTheme.Queries.SuggestCvThemes;
/// <summary>
/// Bộ máy lọc & xếp hạng mẫu CV 
/// Matching dựa trên rule-based/metadata mà không trực tiếp can thiệp hay sửa đổi dữ liệu của CV của người dùng.
/// </summary>
/// 
/// 1.Manifest Contract:
///     - Single Source of Truth: class tải file Application.CvTemplateManifest.json 
///     - Renderer: Save list mapping từ slug sang Renderer(int Columns,string Version)
///     - Goals: chỉ gợi ý những mẫu đã thực sự có component render ở frontend , nếu mẫu trong db mà không xuất hiện trong manifest, nó bị out ngay lập tức
public static class CvThemeMatcher
{
    
    public sealed record Renderer(int Columns, string Version);
    public static readonly IReadOnlyDictionary<string, Renderer> Renderers = LoadRenderers();
    private static IReadOnlyDictionary<string, Renderer> LoadRenderers()
    {
        using var stream = typeof(CvThemeMatcher).Assembly.GetManifestResourceStream("Application.CvTemplateManifest.json")
            ?? throw new InvalidOperationException("Missing CV renderer manifest.");
        return JsonSerializer.Deserialize<Dictionary<string, Renderer>>(stream, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;
    }

    public static string Normalize(string? value)
    {
        var chars = (value ?? "").Normalize(NormalizationForm.FormD).Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark).ToArray();
        return Regex.Replace(new string(chars).ToLowerInvariant().Replace('đ', 'd'), @"[^\p{L}\p{N}+#]+", " ").Trim();
    }
    private static bool Phrase(string text, string phrase) => (" " + Normalize(text) + " ").Contains(" " + Normalize(phrase) + " ");
    private static string[] Csv(string? value) => (value ?? "").Split([',', ';', '|', '/'], StringSplitOptions.RemoveEmptyEntries).Select(Normalize).Where(v => v.Length > 0).Distinct().ToArray();
    private static bool All(string? value) => Csv(value).Contains("all");

    private static readonly Dictionary<string, string[]> Industries = new()
    {
        ["it"] = ["it", "cntt", "cong nghe thong tin", "software", "developer", "backend", "frontend", "fullstack", "devops", "sre", "lap trinh", "cong nghe", "ky su phan mem",
            "tester", "qa", "qc", "mobile", "android", "ios", "cloud", "network", "security", "an ninh mang",
            "java", "python", "c#", "javascript", "typescript", "react", "angular", "vue", "nodejs", "net", "sql", "golang", "php", "kotlin", "swift", "aws", "azure", "docker", "kubernetes", "linux", "git"],
        ["data"] = ["data", "ai", "ml", "du lieu", "tri tue nhan tao", "machine learning", "data engineer", "data analyst",
            "pandas", "tensorflow", "pytorch", "tableau", "power bi", "excel", "spark"],
        ["design"] = ["design", "designer", "thiet ke", "ui", "ux", "do hoa", "figma", "photoshop", "illustrator", "after effect", "graphic"],
        ["marketing"] = ["marketing", "truyen thong", "quang cao", "content", "social", "branding", "event", "seo", "sem", "ads", "digital"],
        ["finance"] = ["finance", "tai chinh", "ngan hang", "ke toan", "kiem toan", "thue", "accountant", "banking"],
        ["legal"] = ["legal", "law", "luat", "phap che", "luat su"],
        ["healthcare"] = ["healthcare", "medical", "y te", "bac si", "doctor", "nurse", "dieu duong"],
        ["education"] = ["education", "giao duc", "giao vien", "teacher", "dao tao"],
        ["research"] = ["research", "nghien cuu", "hoc thuat", "academic"],
        ["architecture"] = ["architecture", "kien truc", "xay dung"],
        ["hospitality"] = ["hospitality", "du lich", "khach san", "dich vu", "f b", "dau bep", "chef", "culinary"],
        ["sales"] = ["sales", "kinh doanh", "ban le", "ban hang", "telesale", "cskh", "cham soc khach hang"],
        ["product"] = ["product", "san pham", "pm", "ba", "product owner"],
        ["management"] = ["management", "quan ly", "lanh dao", "director", "manager"],
        ["manufacturing"] = ["manufacturing", "co khi", "san xuat"],
        ["environment"] = ["environment", "moi truong", "ngo"],
        ["fashion"] = ["fashion", "thoi trang"]
    };
    public static string Industry(string? value) => Industries.FirstOrDefault(kv => kv.Value.Any(alias => Phrase(value ?? "", alias))).Key ?? Normalize(value);
    private static IEnumerable<string> ThemeIndustries(Theme theme) => Csv(theme.NganhPhuHop).Select(Industry);

    public static string Level(string? value, bool strict = false)
    {
        var text = Normalize(value);
        if (string.IsNullOrEmpty(text) || text == "all") return "";
        var matches = new List<string>();
        foreach (var (level, aliases) in new (string, string[])[] {
            ("intern", ["intern", "thuc tap"]), ("fresher", ["fresher", "moi tot nghiep", "sinh vien"]),
            ("junior", ["junior"]), ("mid", ["mid", "middle", "mid level", "trung cap"]),
            ("lead", ["lead", "tech lead", "truong nhom"]), ("manager", ["manager", "director", "quan ly", "giam doc"]),
            ("senior", ["senior", "cao cap"]) })
            if (aliases.Any(a => Phrase(text, a))) matches.Add(level);
        if (strict && matches.Count > 1) throw new ApiException("Chỉ chọn một cấp độ công việc mục tiêu.", 400);
        if (matches.Count > 0) return matches[0];
        if (strict) throw new ApiException("Cấp độ phải là intern, fresher, junior, mid, senior, lead, manager hoặc all.", 400);
        return "";
    }
    public static string Style(string? value)
    {
        var text = Normalize(value);
        if (new[] { "minimal", "toi gian", "don gian", "ats" }.Any(a => Phrase(text, a))) return "minimal";
        if (new[] { "creative", "sang tao", "portfolio" }.Any(a => Phrase(text, a))) return "creative";
        if (new[] { "classic", "corporate", "trang trong", "co dien", "chuyen nghiep" }.Any(a => Phrase(text, a))) return "classic";
        if (new[] { "modern", "hien dai" }.Any(a => Phrase(text, a))) return "modern";
        if (new[] { "editorial", "tap chi" }.Any(a => Phrase(text, a))) return "editorial";
        return text;
    }
    private static bool RoleMatch(Theme t, string position)
    {
        if (string.IsNullOrWhiteSpace(position)) return false;
        return Csv(t.ViTriMucTieu).Where(x => x != "all").Any(x => Phrase(position, x)) ||
            Csv(t.Tags).Where(x => x.Length > 2 && x != "ats" && Level(x) == "").Any(x => Phrase(position, x));
    }

    public static List<SuggestedCvThemeViewModel> Rank(IEnumerable<Theme> themes, GetSuggestedCvThemesQuery request, string position, IEnumerable<string> skills)
    {
        if (request.SoCot.HasValue && request.SoCot is not (1 or 2)) throw new ApiException("Số cột phải là 1 hoặc 2.", 400);
        var level = string.IsNullOrWhiteSpace(request.CapBac) ? Level(position) : Level(request.CapBac, true);
        var industry = Industry(string.IsNullOrWhiteSpace(request.Nganh) ? position : request.Nganh);
        // A job title without an industry alias is not itself an industry taxonomy.
        if (string.IsNullOrWhiteSpace(request.Nganh) && !Industries.ContainsKey(industry)) industry = "";
        // Fallback cuối: suy ngành từ kỹ năng (keyword) khi vị trí không suy được — để tool vẫn trả kết quả
        // kèm lý do rõ ràng thay vì dồn model đi hỏi user.
        var industryFromSkills = false;
        if (string.IsNullOrWhiteSpace(industry) && skills.Any())
        {
            var hit = Industries.FirstOrDefault(kv => skills.Any(s => kv.Value.Any(alias => Phrase(s, alias)))).Key;
            if (!string.IsNullOrEmpty(hit)) { industry = hit; industryFromSkills = true; }
        }
        var style = Style(request.PhongCach);
        var skillTokens = skills.Select(Normalize).Where(x => x.Length > 1).ToHashSet();
        var missing = new List<string>();
        if (string.IsNullOrWhiteSpace(position)) missing.Add("vị trí mục tiêu");
        if (string.IsNullOrWhiteSpace(industry)) missing.Add("ngành mục tiêu");
        if (string.IsNullOrWhiteSpace(level)) missing.Add("cấp độ công việc mục tiêu");
        var ranked = new List<SuggestedCvThemeViewModel>();
        foreach (var theme in themes.Where(t => t.IsActive))
        {
            if (!Renderers.TryGetValue(theme.Slug ?? "", out var renderer)) continue;
            if (request.SoCot.HasValue && request.SoCot != renderer.Columns || request.BatBuocATS && !theme.ThanThienATS) continue;
            var reasons = new List<string>(); var warnings = new List<string>(); double score = 0;
            var roleMatch = RoleMatch(theme, position);
            var industryMatch = industry.Length > 0 && ThemeIndustries(theme).Contains(industry);
            if (position.Length > 0 || industry.Length > 0)
            {
                if (!roleMatch && !industryMatch && !All(theme.NganhPhuHop) && !All(theme.ViTriMucTieu)) continue;
                if (roleMatch) { score += .25; reasons.Add($"Khớp vị trí {position}"); }
                else if (All(theme.ViTriMucTieu)) score += .08;
                if (industryMatch) { score += .25; reasons.Add(industryFromSkills ? $"Suy ngành {industry} từ kỹ năng CV" : $"Khớp ngành {industry}"); }
                else if (All(theme.NganhPhuHop)) { score += .10; reasons.Add("Mẫu đa ngành"); }
            }
            else if (All(theme.NganhPhuHop)) { score += .15; reasons.Add("Mẫu đa ngành khi chưa rõ mục tiêu"); }
            var levels = Csv(theme.CapBac).Concat(Csv(theme.Tags)).Select(x => Level(x)).Where(x => x.Length > 0).ToHashSet();
            if (level.Length > 0 && !All(theme.CapBac) && levels.Count > 0 && !levels.Contains(level)) continue;
            if (level.Length > 0 && levels.Contains(level)) { score += .20; reasons.Add($"Phù hợp cấp độ {level}"); }
            else if (All(theme.CapBac)) score += .07;
            else if (level.Length > 0 && levels.Count > 0) { score -= .15; warnings.Add($"Metadata cấp độ ưu tiên {string.Join(", ", levels)}, không phải {level}"); }
            if (level.Length > 0 && Csv(theme.TranhSuDungKhi).Any(x => Level(x) == level)) { score -= .25; warnings.Add("Cấp độ mục tiêu nằm trong trường hợp metadata khuyên tránh"); }
            var themeStyle = Style(theme.PhongCachThietKe);
            if (style.Length > 0 && (themeStyle == style || style == "minimal" && themeStyle == "classic")) { score += .10; reasons.Add($"Phong cách {style}"); }
            else if (style.Length > 0) warnings.Add($"Phong cách mẫu là {themeStyle}; chưa khớp yêu cầu {style}");
            var tagMatches = Csv(theme.Tags).Count(t => skillTokens.Contains(t));
            if (tagMatches > 0) { score += Math.Min(.05, tagMatches * .01); reasons.Add($"Khớp {tagMatches} nhóm kỹ năng"); }
            var sectionText = Normalize(string.Join(" ", theme.Tags, theme.KhuyenNghiSuDung, theme.GoiYAI, theme.MoTa));
            foreach (var section in (request.NhanManh ?? []).Distinct().Take(3))
            {
                var aliases = Normalize(section) switch { "projects" or "du an" => new[] { "du an", "project", "portfolio" }, "experience" or "kinh nghiem" => ["kinh nghiem", "thanh tich", "leadership"], "skills" or "ky nang" => ["ky nang", "stack"], "education" or "hoc van" => ["hoc van", "hoc thuat"], _ => Array.Empty<string>() };
                if (aliases.Any(a => Phrase(sectionText, a))) { score += .03; reasons.Add($"Metadata đề xuất nhấn mạnh {section}"); }
            }
            if (request.UuTienATS && theme.ThanThienATS) { score += .10; reasons.Add("Metadata đánh dấu thân thiện ATS"); }
            else if (request.UuTienATS && !theme.ThanThienATS) warnings.Add("Không được metadata đánh dấu thân thiện ATS");
            if (request.SoCot.HasValue) reasons.Add($"Đúng bố cục {renderer.Columns} cột");
            if (theme.SoCot != renderer.Columns) warnings.Add("Số cột metadata khác renderer; dùng bố cục thực tế của renderer");
            if (!string.IsNullOrWhiteSpace(theme.TranhSuDungKhi)) warnings.Add("Nên tránh: " + theme.TranhSuDungKhi[..Math.Min(300, theme.TranhSuDungKhi.Length)]);
            if (missing.Count > 0) warnings.Add("Chưa biết " + string.Join(", ", missing) + "; đề xuất còn tổng quát");
            if (score <= 0) continue;
            ranked.Add(new SuggestedCvThemeViewModel { Slug = theme.Slug, Ten = theme.Ten, MoTaNgan = theme.MoTaNgan,
                Diem = Math.Round(Math.Clamp(score, 0, 1), 2), LyDo = string.Join("; ", reasons), CanhBao = warnings,
                Nganh = industry, ViTri = position, CapBac = level, SoCot = renderer.Columns, TemplateVersion = renderer.Version,
                ThanThienATS = theme.ThanThienATS, PhongCach = themeStyle, MatchingVersion = "theme-v2" });
        }
        return ranked.OrderByDescending(t => t.Diem).ThenBy(t => themes.First(x => x.Slug == t.Slug).ThuTu).ThenBy(t => t.Slug, StringComparer.Ordinal)
            .Take(Math.Clamp(request.TopN, 1, 3)).ToList();
    }
}
