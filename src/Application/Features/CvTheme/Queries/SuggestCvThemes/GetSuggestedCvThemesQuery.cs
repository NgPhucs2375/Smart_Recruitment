#nullable enable
using Application.Exceptions;
using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CvTheme.Queries.SuggestCvThemes;

public class GetSuggestedCvThemesQuery : IRequest<Response<List<SuggestedCvThemeViewModel>>>
{
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
    public int TopN { get; set; } = 3;
}

public class GetSuggestedCvThemesQueryHandler(IApplicationDbContext context, ICurrentNguoiDungService current)
    : IRequestHandler<GetSuggestedCvThemesQuery, Response<List<SuggestedCvThemeViewModel>>>
{
    public async Task<Response<List<SuggestedCvThemeViewModel>>> Handle(GetSuggestedCvThemesQuery request, CancellationToken ct)
    {
        var actor = await current.ResolveAsync();
        var query = context.CVUngViens.AsNoTracking().Include(x => x.KyNangs).Include(x => x.HoSoUngVien)
            .Where(x => !x.IsDaXoa && x.HoSoUngVien.NguoiDungId == actor.Id);
        var cv = request.CvUngVienId.HasValue
            ? await query.FirstOrDefaultAsync(x => x.Id == request.CvUngVienId, ct)
            : request.UseSavedCv ? await query.OrderByDescending(x => x.IsDefault).ThenByDescending(x => x.Id).FirstOrDefaultAsync(ct) : null;
        if (request.CvUngVienId.HasValue && cv == null) throw new ApiException("Không tìm thấy CV trong phạm vi của bạn.", 403);
        var position = request.ViTri?.Trim();
        if (string.IsNullOrWhiteSpace(position)) position = cv?.HoSoUngVien?.ViTriUngTuyen;
        if (request.UseSavedCv && string.IsNullOrWhiteSpace(position)) position = await context.HoSoUngViens.Where(h => h.NguoiDungId == actor.Id)
            .Select(h => h.ViTriUngTuyen).FirstOrDefaultAsync(ct);
        var themes = await context.CvThemes.AsNoTracking().Where(t => t.IsActive).ToListAsync(ct);
        var skills = (request.KyNang ?? []).Concat(cv?.KyNangs.Select(k => k.TenKyNang) ?? []).Take(100);
        var ranked = CvThemeMatcher.Rank(themes, request, position ?? "", skills);
        return new Response<List<SuggestedCvThemeViewModel>>(ranked, ranked.Count > 0
            ? "Đề xuất theo metadata; điểm là mức phù hợp mẫu, không phải xác suất tuyển dụng. ATS là nhãn metadata, không bảo đảm mọi parser."
            : "Không có mẫu đang bật, render được và phù hợp các điều kiện. Hãy thử nới số cột/ATS hoặc cập nhật metadata.");
    }
}
