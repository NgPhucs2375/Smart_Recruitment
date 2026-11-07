using Application.Exceptions;
using Application.Features.CvTheme.Queries.SuggestCvThemes;
using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CvTheme.Queries.PickCvThemes;

/// <summary>
/// Bước "hành động" của agent: model đọc workspace rồi tự chọn mẫu, còn ở đây
/// server kiểm định quyết định đó trước khi nó tới giao diện. Slug bịa, mẫu
/// đã tắt, mẫu không có renderer hay vi phạm ràng buộc cứng đều bị chặn —
/// người dùng không bao giờ nhận về một mẫu không mở được.
/// </summary>
public class PickCvThemesQuery : IRequest<Response<List<SuggestedCvThemeViewModel>>>
{
    /// <summary>Nhãn phiên bản để test và UI phân biệt quyết định do model chọn với rule thuần.</summary>
    public const string AgentVersion = "theme-agent-v1";

    public string[]? Slugs { get; set; }
    /// <summary>Lý do model nêu, tương ứng theo thứ tự Slugs.</summary>
    public string[]? LyDo { get; set; }
    public int? CvUngVienId { get; set; }
    public bool UseSavedCv { get; set; } = true;
    public string? ViTri { get; set; }
    public string? Nganh { get; set; }
    public string? CapBac { get; set; }
    public string? PhongCach { get; set; }
    public int? SoCot { get; set; }
    public bool UuTienATS { get; set; } = true;
    public bool BatBuocATS { get; set; }
    public string[]? NhanManh { get; set; }
    public string[]? KyNang { get; set; }
}

public class PickCvThemesQueryHandler(IApplicationDbContext context, ICurrentNguoiDungService current)
    : IRequestHandler<PickCvThemesQuery, Response<List<SuggestedCvThemeViewModel>>>
{
    /// <summary>Điểm sàn khi rule metadata không xếp hạng được mẫu model đã chọn (thiếu metadata, không phải mẫu_bad).</summary>
    private const double UnrankedScore = 0.5;

    public async Task<Response<List<SuggestedCvThemeViewModel>>> Handle(PickCvThemesQuery request, CancellationToken ct)
    {
        var picks = (request.Slugs ?? []).Select(s => (s ?? "").Trim().ToLowerInvariant()).Where(s => s.Length > 0)
            .Distinct().Take(3).ToArray();
        if (picks.Length == 0) throw new ApiException("Chọn ít nhất một mẫu từ danh mục.", 400);

        var actor = await current.ResolveAsync();
        var query = context.CVUngViens.AsNoTracking().Include(x => x.KyNangs).Include(x => x.HoSoUngVien)
            .Where(x => !x.IsDaXoa && x.HoSoUngVien.NguoiDungId == actor.Id);
        var cv = request.CvUngVienId.HasValue
            ? await query.FirstOrDefaultAsync(x => x.Id == request.CvUngVienId, ct)
            : request.UseSavedCv ? await query.OrderByDescending(x => x.IsDefault).ThenByDescending(x => x.Id).FirstOrDefaultAsync(ct) : null;
        if (request.CvUngVienId.HasValue && cv == null) throw new ApiException("Không tìm thấy CV trong phạm vi của bạn.", 403);

        var position = request.ViTri?.Trim();
        if (string.IsNullOrWhiteSpace(position)) position = cv?.HoSoUngVien?.ViTriUngTuyen;
        if (request.UseSavedCv && string.IsNullOrWhiteSpace(position)) position = await context.HoSoUngViens
            .Where(h => h.NguoiDungId == actor.Id).Select(h => h.ViTriUngTuyen).FirstOrDefaultAsync(ct);
        var skills = (request.KyNang ?? []).Concat(cv?.KyNangs.Select(k => k.TenKyNang) ?? []).Take(100);

        var themes = await context.CvThemes.AsNoTracking().Where(t => t.IsActive).ToListAsync(ct);
        var ruleRequest = new GetSuggestedCvThemesQuery
        {
            CvUngVienId = request.CvUngVienId, UseSavedCv = request.UseSavedCv, ViTri = request.ViTri,
            Nganh = request.Nganh, CapBac = request.CapBac, PhongCach = request.PhongCach, SoCot = request.SoCot,
            UuTienATS = request.UuTienATS, BatBuocATS = request.BatBuocATS, NhanManh = request.NhanManh,
            KyNang = request.KyNang, TopN = 3,
        };
        var ruleRanked = CvThemeMatcher.RankAll(themes, ruleRequest, position ?? "", skills);
        var ruleBySlug = ruleRanked.GroupBy(t => (t.Slug ?? "").ToLowerInvariant())
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.Ordinal);
        var themeBySlug = themes.GroupBy(t => (t.Slug ?? "").ToLowerInvariant())
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.Ordinal);

        var accepted = new List<SuggestedCvThemeViewModel>();
        var rejected = new List<string>();
        for (var i = 0; i < picks.Length; i++)
        {
            var slug = picks[i];
            if (!themeBySlug.TryGetValue(slug, out var theme))
            {
                rejected.Add($"{slug}: không có mẫu đang bật trong hệ thống");
                continue;
            }
            var renderer = CvThemeMatcher.ResolveRenderer(theme);
            if (renderer is null)
            {
                rejected.Add($"{slug}: chưa có bản render, không mở được CV");
                continue;
            }
            if (request.BatBuocATS && !theme.ThanThienATS)
            {
                rejected.Add($"{slug}: không đạt yêu cầu ATS bắt buộc");
                continue;
            }
            if (request.SoCot.HasValue && renderer.Columns != request.SoCot)
            {
                rejected.Add($"{slug}: bố cục {renderer.Columns} cột, không đúng yêu cầu {request.SoCot} cột");
                continue;
            }

            var reason = (request.LyDo ?? []).Length > i ? (request.LyDo![i] ?? "").Trim() : "";
            var rule = ruleBySlug.TryGetValue(slug, out var r) ? r : null;
            var warnings = rule?.CanhBao is { Count: > 0 } ? new List<string>(rule.CanhBao) : new List<string>();
            if (rule is null)
                warnings.Add("Metadata mẫu chưa đủ để rule xếp hạng; Adam chọn theo mô tả mẫu — hãy xem lại nếu kết quả không hợp.");

            accepted.Add(new SuggestedCvThemeViewModel
            {
                Slug = theme.Slug, Ten = theme.Ten, MoTaNgan = theme.MoTaNgan,
                Diem = rule?.Diem ?? UnrankedScore,
                LyDo = reason.Length > 0 ? reason : rule?.LyDo ?? "Adam chọn mẫu này cho mục tiêu của bạn.",
                CanhBao = warnings,
                Nganh = rule?.Nganh ?? "", ViTri = rule?.ViTri ?? position ?? "", CapBac = rule?.CapBac ?? "",
                PhongCach = rule?.PhongCach ?? CvThemeMatcher.Style(theme.PhongCachThietKe),
                SoCot = renderer.Columns, TemplateVersion = renderer.Version, ThanThienATS = theme.ThanThienATS,
                MatchingVersion = PickCvThemesQuery.AgentVersion,
            });
        }

        var message = accepted.Count == 0
            ? "Không mẫu nào Adam chọn hợp lệ với dữ liệu hiện có. Hãy chọn lại trong danh mục mẫu."
            : $"Adam chọn theo CV, server kiểm định {accepted.Count} mẫu đạt."
              + (rejected.Count > 0 ? $" Đã loại {rejected.Count} lựa chọn không hợp lệ." : "")
              + " Điểm là mức phù hợp theo metadata, không phải xác suất tuyển dụng.";
        if (rejected.Count > 0 && accepted.Count > 0)
            accepted[0].CanhBao.Add("Adam từng đề xuất mẫu không hợp lệ: " + string.Join("; ", rejected));
        return new Response<List<SuggestedCvThemeViewModel>>(accepted, message);
    }
}
