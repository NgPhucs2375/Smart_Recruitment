using Application.Interfaces;
using Application.Features.KetQuaPhuHop.Cache;
using Application.Features.KetQuaPhuHop.Matching;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace Application.Features.KetQuaPhuHop.Queries.SuggestCandidatesForJob;

public class GetSuggestedCandidatesForJobQuery : IRequest<Response<List<SuggestedCandidateViewModel>>>
{
    public int TinTuyenDungId { get; set; }
    public int TopN { get; set; } = 10;
}

public class SuggestedCandidateViewModel
{
    public int HoSoUngVienId { get; set; }
    public int CvUngVienId { get; set; }
    public string HoTen { get; set; } = string.Empty;
    public string ViTriUngTuyen { get; set; } = string.Empty;
    public float DiemPhuHop { get; set; }
    public string PhanLoai { get; set; } = string.Empty;
    public List<string> KyNangThoa { get; set; } = new();
    public List<string> KyNangThieu { get; set; } = new();
    public int SoNamKinhNghiem { get; set; }
}

public class GetSuggestedCandidatesForJobQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService currentNguoiDungService,
    IDistributedCache cache)
    : IRequestHandler<GetSuggestedCandidatesForJobQuery, Response<List<SuggestedCandidateViewModel>>>
{
    public async Task<Response<List<SuggestedCandidateViewModel>>> Handle(
        GetSuggestedCandidatesForJobQuery request,
        CancellationToken cancellationToken)
    {
        var current = await currentNguoiDungService.ResolveAsync();
        if (current.VaiTro is not (VaiTroNguoiDung.NHAN_SU or VaiTroNguoiDung.NGUOI_DAI_DIEN))
            return new Response<List<SuggestedCandidateViewModel>>("Chức năng này chỉ dành cho nhân sự hoặc người đại diện.");
        if (!current.DoanhNghiepId.HasValue)
            return new Response<List<SuggestedCandidateViewModel>>("Tài khoản chưa thuộc doanh nghiệp nào.");

        var job = await context.TinTuyenDungs.AsNoTracking()
            .Include(x => x.KyNangTinTuyenDungs)
                .ThenInclude(x => x.KyNang)
            .FirstOrDefaultAsync(x => x.Id == request.TinTuyenDungId &&
                                      x.DoanhNghiepId == current.DoanhNghiepId.Value,
                cancellationToken);
        if (job == null)
            return new Response<List<SuggestedCandidateViewModel>>("Không tìm thấy tin tuyển dụng thuộc doanh nghiệp của bạn.");

        var jobVersion = await RecommendationCache.GetVersionAsync(
            cache,
            RecommendationCache.JobsVersionKey,
            cancellationToken);
        var candidateVersion = await RecommendationCache.GetVersionAsync(
            cache,
            RecommendationCache.CandidatePoolVersionKey,
            cancellationToken);
        var cacheKey = RecommendationCache.CandidateRecommendationsKey(
            current.DoanhNghiepId.Value,
            job.Id,
            jobVersion,
            candidateVersion,
            Math.Clamp(request.TopN, 1, 20));
        var cached = await RecommendationCache.GetAsync<List<SuggestedCandidateViewModel>>(
            cache,
            cacheKey,
            cancellationToken);
        if (cached != null)
        {
            return new Response<List<SuggestedCandidateViewModel>>(
                cached,
                cached.Count == 0
                    ? "Chưa tìm thấy ứng viên phù hợp với tin tuyển dụng này."
                    : $"Tìm thấy {cached.Count} ứng viên phù hợp.");
        }

        var requirements = job.KyNangTinTuyenDungs
            .Where(x => x.KyNang != null && !string.IsNullOrWhiteSpace(x.KyNang.TenKyNang))
            .Select(x => new MatchRequirement(x.KyNangId, x.KyNang.TenKyNang, x.MucDoYeuCau))
            .ToList();
        var jobInput = new JobMatchInput(requirements, job.TieuDe,
            job.LuongToiThieu, job.LuongToiDa, job.DiaDiemLamViec);
        var now = DateTime.UtcNow;
        var cvs = await context.CVUngViens.AsNoTracking()
            .Include(x => x.ThongTinLienHe)
            .Include(x => x.KyNangs)
            .Include(x => x.HoSoUngVien)
                .ThenInclude(x => x.KinhNghiemLamViecs)
            .Where(x => x.IsDefault && !x.IsDaXoa && x.HoSoUngVien.IsTimViec)
            .ToListAsync(cancellationToken);

        var results = new List<SuggestedCandidateViewModel>();
        foreach (var cv in cvs)
        {
            var match = ContentBasedMatcher.Evaluate(new CandidateMatchInput(
                cv.KyNangs.Select(x => new MatchSkill(x.KyNangId, x.TenKyNang)).ToList(),
                !string.IsNullOrWhiteSpace(cv.ThongTinLienHe?.ViTriUngTuyen)
                    ? cv.ThongTinLienHe.ViTriUngTuyen : cv.HoSoUngVien.ViTriUngTuyen,
                cv.ThongTinLienHe?.MucLuongMongMuon ?? (decimal)cv.HoSoUngVien.MucLuongMongMuon,
                !string.IsNullOrWhiteSpace(cv.ThongTinLienHe?.DiaChi)
                    ? cv.ThongTinLienHe.DiaChi : cv.HoSoUngVien.DiaChi), jobInput);
            if (match.Score <= 0f) continue;

            results.Add(new SuggestedCandidateViewModel
            {
                HoSoUngVienId = cv.HoSoUngVienId,
                CvUngVienId = cv.Id,
                HoTen = cv.ThongTinLienHe?.HoTen ?? cv.HoSoUngVien.HoTen ?? string.Empty,
                ViTriUngTuyen = cv.ThongTinLienHe?.ViTriUngTuyen ?? cv.HoSoUngVien.ViTriUngTuyen ?? string.Empty,
                DiemPhuHop = match.Score,
                PhanLoai = match.Score >= 0.66f ? "Cao" : match.Score >= 0.33f ? "TrungBinh" : "Thap",
                KyNangThoa = match.MatchedSkills.ToList(),
                KyNangThieu = match.MissingSkills.ToList(),
                SoNamKinhNghiem = (int)Math.Floor(cv.HoSoUngVien.KinhNghiemLamViecs
                    .Where(x => x.TuNgay.HasValue)
                    .Sum(x => ((x.DenNgay ?? now) - x.TuNgay!.Value).TotalDays) / 365d)
            });
        }

        var top = results.OrderByDescending(x => x.DiemPhuHop)
            .ThenBy(x => x.HoTen)
            .Take(Math.Clamp(request.TopN, 1, 20))
            .ToList();
        await RecommendationCache.SetAsync(cache, cacheKey, top, cancellationToken);
        return new Response<List<SuggestedCandidateViewModel>>(top,
            top.Count == 0 ? "Chưa tìm thấy ứng viên phù hợp với tin tuyển dụng này." : $"Tìm thấy {top.Count} ứng viên phù hợp.");
    }
}
