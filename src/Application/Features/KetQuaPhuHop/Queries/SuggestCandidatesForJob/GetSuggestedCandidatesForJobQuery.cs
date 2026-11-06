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
    /// <summary>Lý do gợi ý do DeepSeek viết; null khi rerank tắt hoặc mô hình lỗi.</summary>
    public string? LyDoGoiY { get; set; }
    public List<string> KyNangThoa { get; set; } = new();
    public List<string> KyNangThieu { get; set; } = new();
    /// <summary>Yeu cau BatBuc cua tin ma ho so chua co bang chung. Khong doi diem — chi la nhan.</summary>
    public List<string> KyNangBatBuocThieu { get; set; } = new();
    public int SoNamKinhNghiem { get; set; }
}

public class GetSuggestedCandidatesForJobQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService currentNguoiDungService,
    IRecommendationReranker reranker,
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
                .ThenInclude(x => x.DanhMucKyNang)
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
            .Where(x => x.DanhMucKyNang != null && !string.IsNullOrWhiteSpace(x.DanhMucKyNang.TenKyNang))
            .Select(x => new MatchRequirement(x.KyNangId, x.DanhMucKyNang.TenKyNang, x.MucDoYeuCau))
            .ToList();
        var jobInput = new JobMatchInput(requirements, job.TieuDe,
            job.LuongToiThieu, job.LuongToiDa, job.DiaDiemLamViec);
        var now = DateTime.UtcNow;
        // 4 Include trên cùng query sinh cartesian explosion: tách thành
        // nhiều query (cùng kết quả, không đổi semantics scoring).
        var cvs = await context.CVUngViens.AsNoTracking()
            .AsSplitQuery()
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
                cv.KyNangs.Select(x => new MatchSkill(x.KyNangId, x.TenKyNang, x.MucDoThanhThao, x.SoNamKinhNghiem)).ToList(),
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
                PhanLoai = ContentBasedMatcher.PhanLoaiCua(match.Score).ToString(),
                KyNangThoa = match.MatchedSkills.ToList(),
                KyNangThieu = match.MissingSkills.ToList(),
                KyNangBatBuocThieu = match.MissingMandatory.ToList(),
                SoNamKinhNghiem = (int)Math.Floor(cv.HoSoUngVien.KinhNghiemLamViecs
                    .Where(x => x.TuNgay.HasValue)
                    .Sum(x => ((x.DenNgay ?? now) - x.TuNgay!.Value).TotalDays) / 365d)
            });
        }

        var top = results.OrderByDescending(x => x.DiemPhuHop)
            .ThenBy(x => x.HoTen)
            .Take(Math.Clamp(request.TopN, 1, 20))
            .ToList();
        top = await RerankAsync(job.TieuDe, requirements, top, cancellationToken);
        await RecommendationCache.SetAsync(cache, cacheKey, top, cancellationToken);
        return new Response<List<SuggestedCandidateViewModel>>(top,
            top.Count == 0 ? "Chưa tìm thấy ứng viên phù hợp với tin tuyển dụng này." : $"Tìm thấy {top.Count} ứng viên phù hợp.");
    }

    // DeepSeek chỉ sắp lại cửa sổ top-N và viết lý do. Tên ứng viên không rời khỏi
    // hệ thống: mô hình chỉ nhận vị trí ứng tuyển, kỹ năng trùng/thiếu, số năm KN.
    private async Task<List<SuggestedCandidateViewModel>> RerankAsync(
        string jobTitle,
        IReadOnlyList<MatchRequirement> requirements,
        List<SuggestedCandidateViewModel> items,
        CancellationToken cancellationToken)
    {
        var jobContext = "Tin tuyển dụng: " + jobTitle
            + "; kỹ năng yêu cầu: " + string.Join(", ",
                requirements.Select(x => $"{x.Name} ({x.Level})"));

        var result = await reranker.RerankAsync(
            jobContext,
            items.Select(x => new RerankItem(
                x.CvUngVienId,
                $"{x.ViTriUngTuyen}, khoảng {x.SoNamKinhNghiem} năm kinh nghiệm",
                x.KyNangThoa,
                x.KyNangThieu,
                x.DiemPhuHop)).ToList(),
            cancellationToken);
        if (result is null)
            return items;

        var byId = items.ToDictionary(x => x.CvUngVienId);
        var ordered = new List<SuggestedCandidateViewModel>(items.Count);
        foreach (var id in result.OrderedIds)
        {
            if (!byId.TryGetValue(id, out var vm))
                continue;
            vm.LyDoGoiY = result.Reasons.GetValueOrDefault(id);
            ordered.Add(vm);
        }

        // Ứng viên ngoài cửa sổ rerank giữ nguyên thứ tự luật.
        var ranked = ordered.Select(x => x.CvUngVienId).ToHashSet();
        ordered.AddRange(items.Where(x => !ranked.Contains(x.CvUngVienId)));
        return ordered;
    }
}
