using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CvTheme.Queries.SuggestCvThemes;

/// <summary>
/// Gợi ý theme CV theo hồ sơ (rule-based theme-v1, chưa dùng vector).
/// Điểm = khớp cấp bậc + khớp ngành/vị trí + trùng tags kỹ năng + bonus ATS.
/// </summary>
public class GetSuggestedCvThemesQuery : IRequest<Response<List<SuggestedCvThemeViewModel>>>
{
    public int? CvUngVienId { get; set; }
    public string ViTri { get; set; }
    public int TopN { get; set; } = 3;
}

public class GetSuggestedCvThemesQueryHandler(
    IApplicationDbContext context)
    : IRequestHandler<GetSuggestedCvThemesQuery, Response<List<SuggestedCvThemeViewModel>>>
{
    public async Task<Response<List<SuggestedCvThemeViewModel>>> Handle(
        GetSuggestedCvThemesQuery request,
        CancellationToken cancellationToken)
    {
        var themes = await context.CvThemes
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.ThuTu)
            .ToListAsync(cancellationToken);

        if (themes.Count == 0)
        {
            return new Response<List<SuggestedCvThemeViewModel>>(
                new List<SuggestedCvThemeViewModel>());
        }

        var viTri = (request.ViTri ?? string.Empty).Trim();
        var skills = new List<string>();
        double maxYears = 0;
        var kinhNghiemCount = 0;

        Domain.Entities.CVUngVien cv = null;

        if (request.CvUngVienId.HasValue)
        {
            cv = await context.CVUngViens
                .AsNoTracking()
                .Include(x => x.KyNangs)
                .Include(x => x.KinhNghiems)
                .Include(x => x.HoSoUngVien)
                .FirstOrDefaultAsync(
                    x => x.Id == request.CvUngVienId.Value && !x.IsDaXoa,
                    cancellationToken);
        }
        else
        {
            cv = await context.CVUngViens
                .AsNoTracking()
                .Include(x => x.KyNangs)
                .Include(x => x.KinhNghiems)
                .Include(x => x.HoSoUngVien)
                .Where(x => !x.IsDaXoa)
                .OrderByDescending(x => x.IsDefault)
                .ThenByDescending(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (cv != null)
        {
            if (string.IsNullOrWhiteSpace(viTri))
            {
                viTri = cv.HoSoUngVien?.ViTriUngTuyen ?? string.Empty;
            }

            skills = cv.KyNangs
                .Select(k => k.TenKyNang ?? string.Empty)
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .ToList();

            maxYears = cv.KyNangs
                .Select(k => (double)(k.SoNamKinhNghiem ?? 0))
                .DefaultIfEmpty(0)
                .Max();

            kinhNghiemCount = cv.KinhNghiems?.Count ?? 0;
        }

        var inferredCapBac = InferCapBac(viTri, maxYears, kinhNghiemCount);
        var tokens = Tokenize(viTri + " " + string.Join(" ", skills));

        var ranked = themes
            .Select(t => ScoreTheme(t, inferredCapBac, tokens))
            .OrderByDescending(x => x.Diem)
            .Take(request.TopN > 0 ? request.TopN : 3)
            .ToList();

        return new Response<List<SuggestedCvThemeViewModel>>(ranked);
    }

    private static string InferCapBac(string viTri, double maxYears, int kinhNghiemCount)
    {
        var v = viTri.ToLowerInvariant();

        if (v.Contains("senior") || v.Contains("lead") || v.Contains("manager") ||
            v.Contains("architect") || v.Contains("director") || maxYears >= 5 || kinhNghiemCount >= 4)
        {
            return "senior";
        }

        if (v.Contains("fresher") || v.Contains("intern") || v.Contains("junior") ||
            v.Contains("sinh viên") || v.Contains("mới tốt nghiệp") || maxYears < 1)
        {
            return "fresher";
        }

        return "all";
    }

    private static HashSet<string> Tokenize(string text)
    {
        return text
            .ToLowerInvariant()
            .Split(new[] { ' ', ',', ';', '/', '|', '-', '_', '.', '(', ')' },
                StringSplitOptions.RemoveEmptyEntries)
            .Where(t => t.Length >= 2)
            .ToHashSet();
    }

    private static SuggestedCvThemeViewModel ScoreTheme(
        Domain.Entities.CvTheme theme,
        string capBac,
        HashSet<string> tokens)
    {
        var diem = 0.0;
        var lyDo = new List<string>();

        var themeCapBac = (theme.CapBac ?? "all").Trim().ToLowerInvariant();

        if (themeCapBac == capBac && capBac != "all")
        {
            diem += 0.4;
            lyDo.Add($"phù hợp cấp bậc {capBac}");
        }
        else if (themeCapBac == "all")
        {
            diem += 0.2;
        }

        var nganh = (theme.NganhPhuHop ?? string.Empty).ToLowerInvariant();

        if (nganh.Contains("all"))
        {
            diem += 0.1;
        }
        else if (tokens.Any(t => nganh.Contains(t)))
        {
            diem += 0.3;
            lyDo.Add("đúng ngành mục tiêu");
        }

        var themeTags = (theme.Tags ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(t => t.Trim().ToLowerInvariant())
            .Where(t => t.Length >= 2)
            .ToList();

        var tagMatches = themeTags.Count(t => tokens.Any(tok => tok.Contains(t) || t.Contains(tok)));

        if (tagMatches > 0)
        {
            diem += Math.Min(0.3, tagMatches * 0.1);
            lyDo.Add($"khớp {tagMatches} tags kỹ năng");
        }

        if (theme.ThanThienATS)
        {
            diem += 0.1;
        }

        if (theme.LaMacDinh)
        {
            diem += 0.05;
        }

        if (diem > 1.0) diem = 1.0;

        if (!string.IsNullOrWhiteSpace(theme.KhuyenNghiSuDung))
        {
            lyDo.Add(theme.KhuyenNghiSuDung.Trim());
        }

        return new SuggestedCvThemeViewModel
        {
            Slug = theme.Slug,
            Ten = theme.Ten,
            MoTaNgan = theme.MoTaNgan,
            Diem = Math.Round(diem, 2),
            LyDo = string.Join("; ", lyDo)
        };
    }
}
