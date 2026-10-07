using Application.Interfaces;
using Application.Features.CVUngVien.Cache;
using Application.Features.KetQuaPhuHop.Cache;
using Application.Features.KetQuaPhuHop.Matching;
using Application.Wrappers;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Distributed;
using System.Diagnostics;

namespace Application.Features.KetQuaPhuHop.Queries.SuggestJobsForCv;

// Content-based matching: chấm điểm tin đang tuyển theo mức trùng
// kỹ năng (trọng số theo MucDoYC) + bonus vị trí/lương/địa điểm, rồi persist vào
// bảng KetQuaPhuHop để trang /viec-lam/phu-hop và agent dùng chung kết quả.
public class GetSuggestedJobsForCvQuery : IRequest<Response<List<SuggestedJobViewModel>>>
{
    /// <summary>Bỏ trống để dùng CV mặc định (IsDefault) của ứng viên hiện tại.</summary>
    public int? CvUngVienId { get; set; }

    /// <summary>Số tin trả về sau khi sắp xếp theo điểm giảm dần.</summary>
    public int TopN { get; set; } = 10;

    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; }
    public float MinimumScore { get; set; }
}

public class SuggestedJobViewModel
{
    public int TinTuyenDungId { get; set; }
    public string TieuDe { get; set; } = string.Empty;
    public string TenDoanhNghiep { get; set; } = string.Empty;
    public string DiaDiemLamViec { get; set; } = string.Empty;
    public decimal LuongToiThieu { get; set; }
    public decimal LuongToiDa { get; set; }
    public float DiemPhuHop { get; set; }
    public string PhanLoai { get; set; } = string.Empty;
    public List<string> KyNangThoa { get; set; } = new();
    public List<string> KyNangThieu { get; set; } = new();
    public DateTime? NgayHetHan { get; set; }
}

public class GetSuggestedJobsForCvQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService currentNguoiDungService,
    ILogger<GetSuggestedJobsForCvQueryHandler> logger,
    IDistributedCache cache)
    : IRequestHandler<GetSuggestedJobsForCvQuery, Response<List<SuggestedJobViewModel>>>
{
    public async Task<Response<List<SuggestedJobViewModel>>> Handle(
        GetSuggestedJobsForCvQuery request,
        CancellationToken cancellationToken)
    {
        var timer = Stopwatch.StartNew();
        var currentUser = await currentNguoiDungService.ResolveAsync();
        var hoSo = await context.HoSoUngViens.AsNoTracking()
            .FirstOrDefaultAsync(x => x.NguoiDungId == currentUser.Id, cancellationToken);
        if (hoSo == null)
            return new Response<List<SuggestedJobViewModel>>("Bạn chưa có hồ sơ ứng viên.");

        var cv = request.CvUngVienId.HasValue
            ? await context.CVUngViens.AsNoTracking()
                .Include(x => x.ThongTinLienHe)
                .Include(x => x.KyNangs)
                .FirstOrDefaultAsync(x => x.Id == request.CvUngVienId.Value &&
                                          x.HoSoUngVienId == hoSo.Id && !x.IsDaXoa,
                    cancellationToken)
            : await context.CVUngViens.AsNoTracking()
                .Include(x => x.ThongTinLienHe)
                .Include(x => x.KyNangs)
                .FirstOrDefaultAsync(x => x.HoSoUngVienId == hoSo.Id &&
                                          x.IsDefault && !x.IsDaXoa, cancellationToken);

        if (cv == null)
            return new Response<List<SuggestedJobViewModel>>(
                "Không tìm thấy CV phù hợp. Hãy tạo hoặc chọn một CV mặc định trước.");

        var cvVersion = await RecommendationCache.GetVersionAsync(
            cache,
            CVUngVienListCache.DetailVersionKey(cv.Id),
            cancellationToken);
        var jobsVersion = await RecommendationCache.GetVersionAsync(
            cache,
            RecommendationCache.JobsVersionKey,
            cancellationToken);
        var pageSize = Math.Clamp(request.PageSize > 0 ? request.PageSize : request.TopN, 1, 20);
        var pageNumber = Math.Clamp(request.PageNumber, 1, 1000);
        var requestedTopN = Math.Min(pageNumber * pageSize, 20_000);
        var minimumScore = Math.Clamp(request.MinimumScore, 0f, 1f);
        var cacheKey = RecommendationCache.JobRecommendationsKey(
            currentUser.Id,
            cv.Id,
            cvVersion,
            jobsVersion,
            requestedTopN) + $":min:{minimumScore:0.##}";
        var cached = await RecommendationCache.GetAsync<List<SuggestedJobViewModel>>(
            cache,
            cacheKey,
            cancellationToken);
        if (cached != null)
        {
            var cachedPage = cached
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();
            return new Response<List<SuggestedJobViewModel>>(
                cachedPage,
                cachedPage.Count == 0
                    ? "Chưa có tin tuyển dụng nào phù hợp với CV này (kiểm tra lại kỹ năng đã điền trong CV)."
                    : $"Tìm thấy {cachedPage.Count} tin tuyển dụng phù hợp ở trang {pageNumber}.");
        }

        var candidate = new CandidateMatchInput(
            cv.KyNangs.Select(k => new MatchSkill(k.KyNangId, k.TenKyNang)).ToList(),
            !string.IsNullOrWhiteSpace(cv.ThongTinLienHe?.ViTriUngTuyen)
                ? cv.ThongTinLienHe.ViTriUngTuyen : hoSo.ViTriUngTuyen,
            cv.ThongTinLienHe?.MucLuongMongMuon ?? (decimal)hoSo.MucLuongMongMuon,
            !string.IsNullOrWhiteSpace(cv.ThongTinLienHe?.DiaChi)
                ? cv.ThongTinLienHe.DiaChi : hoSo.DiaChi);

        var now = DateTime.UtcNow;
        var postings = await context.TinTuyenDungs.AsNoTracking()
            .Where(t => t.TrangThai == TrangThaiTinTuyenDung.DangTuyen &&
                        (t.NgayHetHan == null || t.NgayHetHan > now))
            .Select(t => new JobMatchPosting
            {
                Id = t.Id,
                TieuDe = t.TieuDe,
                TenDoanhNghiep = t.DoanhNghiep != null ? t.DoanhNghiep.TenDoanhNghiep : string.Empty,
                DiaDiemLamViec = t.DiaDiemLamViec,
                LuongToiThieu = t.LuongToiThieu,
                LuongToiDa = t.LuongToiDa,
                NgayHetHan = t.NgayHetHan,
                Skills = t.KyNangTinTuyenDungs
                    .Where(k => k.KyNang != null)
                    .Select(k => new JobMatchSkill
                    {
                        KyNangId = k.KyNangId,
                        TenKyNang = k.KyNang!.TenKyNang,
                        MucDoYeuCau = k.MucDoYeuCau,
                    })
                    .ToList(),
            })
            .ToListAsync(cancellationToken);

        logger.LogInformation("Job recommendation query loaded {PostingCount} postings in {ElapsedMs} ms.",
            postings.Count, timer.ElapsedMilliseconds);

        var results = new List<(SuggestedJobViewModel Vm, float Diem, string Thoa, string Thieu)>();
        foreach (var t in postings)
        {
            var match = ContentBasedMatcher.Evaluate(candidate, new JobMatchInput(
                t.Skills.Select(k => new MatchRequirement(k.KyNangId, k.TenKyNang, k.MucDoYeuCau)).ToList(),
                t.TieuDe, t.LuongToiThieu, t.LuongToiDa, t.DiaDiemLamViec));
            if (match.Score <= 0f)
                continue;
            var vm = ToVm(t, match.Score);
            vm.KyNangThoa = match.MatchedSkills.ToList();
            vm.KyNangThieu = match.MissingSkills.ToList();
            results.Add((vm, match.Score,
                string.Join(", ", match.MatchedSkills), string.Join(", ", match.MissingSkills)));
        }

        var top = results
            .Where(r => r.Diem >= minimumScore)
            .OrderByDescending(r => r.Diem)
            .ThenByDescending(r => r.Vm.TinTuyenDungId)
            .Take(requestedTopN)
            .ToList();

        // Persist only the first page used by /viec-lam/phu-hop.
        if (pageNumber == 1)
        {
            var oldRows = await context.KetQuaPhuHops
                .Where(k => k.HoSoUngVienId == hoSo.Id && k.CVUngVienId == cv.Id)
                .ToListAsync(cancellationToken);
            context.KetQuaPhuHops.RemoveRange(oldRows);
            foreach (var r in top)
            {
                context.KetQuaPhuHops.Add(new Domain.Entities.KetQuaPhuHop
                {
                    HoSoUngVienId = hoSo.Id,
                    CVUngVienId = cv.Id,
                    TinTuyenDungId = r.Vm.TinTuyenDungId,
                    DiemPhuHop = r.Diem,
                    KyNangThoa = r.Thoa,
                    KyNangThieu = r.Thieu,
                    PhanLoai = PhanLoaiOf(r.Diem),
                    GhiChu = "Gợi ý content-based: kỹ năng chuẩn hóa + vị trí/lương/địa điểm.",
                    MatchingVersion = ContentBasedMatcher.Version,
                    ExplanationModel = "skill-overlap-weighted-normalized",
                    EvaluateAt = DateTime.UtcNow,
                    Created = DateTime.UtcNow,
                });
            }
            await context.SaveChangesAsync(cancellationToken);
        }

        var allData = top.Select(r => r.Vm).ToList();
        await RecommendationCache.SetAsync(cache, cacheKey, allData, cancellationToken);
        var responseData = allData.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToList();

        logger.LogInformation("Job recommendation completed in {ElapsedMs} ms. Results={ResultCount}.",
            timer.ElapsedMilliseconds, responseData.Count);

        var message = responseData.Count == 0
            ? "Chưa có tin tuyển dụng nào phù hợp với CV này (kiểm tra lại kỹ năng đã điền trong CV)."
            : $"Tìm thấy {responseData.Count} tin tuyển dụng phù hợp ở trang {pageNumber}.";
        return new Response<List<SuggestedJobViewModel>>(
            responseData, message);
    }

    private static SuggestedJobViewModel ToVm(JobMatchPosting t, float diem) => new()
    {
        TinTuyenDungId = t.Id,
        TieuDe = t.TieuDe,
        TenDoanhNghiep = t.TenDoanhNghiep,
        DiaDiemLamViec = t.DiaDiemLamViec ?? string.Empty,
        LuongToiThieu = t.LuongToiThieu,
        LuongToiDa = t.LuongToiDa,
        DiemPhuHop = diem,
        PhanLoai = PhanLoaiOf(diem).ToString(),
        NgayHetHan = t.NgayHetHan,
    };

    private sealed class JobMatchPosting
    {
        public int Id { get; set; }
        public string TieuDe { get; set; } = string.Empty;
        public string TenDoanhNghiep { get; set; } = string.Empty;
        public string? DiaDiemLamViec { get; set; }
        public decimal LuongToiThieu { get; set; }
        public decimal LuongToiDa { get; set; }
        public DateTime? NgayHetHan { get; set; }
        public List<JobMatchSkill> Skills { get; set; } = [];
    }

    private sealed class JobMatchSkill
    {
        public int? KyNangId { get; set; }
        public string? TenKyNang { get; set; }
        public MucDoYC MucDoYeuCau { get; set; }
    }

    private static PhanLoaiKetQua PhanLoaiOf(float diem) =>
        diem >= 0.66f ? PhanLoaiKetQua.Cao
        : diem >= 0.33f ? PhanLoaiKetQua.TrungBinh
        : PhanLoaiKetQua.Thap;
}
