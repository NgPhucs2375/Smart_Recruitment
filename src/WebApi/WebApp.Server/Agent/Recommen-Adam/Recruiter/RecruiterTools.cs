using System.ComponentModel;
using Application.Interfaces;
using Application.Wrappers;
using Application.Features.KetQuaPhuHop.Queries.SuggestJobsForCv;
using Application.Features.KetQuaPhuHop.Queries.SuggestCandidatesForJob;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using WebApp.Server.Agent.SharedState;

namespace WebApp.Server.Agent.RecommenAdam.Recruiter.Tools;

internal sealed class RecruiterTools
{
    private readonly ISender _sender;
    private readonly IApplicationDbContext _context;
    private readonly ICurrentNguoiDungService _current;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly SharedStateStore _sharedState;

    public RecruiterTools(
        ISender sender,
        IApplicationDbContext context,
        ICurrentNguoiDungService current,
        IHttpContextAccessor httpContextAccessor,
        SharedStateStore sharedState)
    {
        _sender = sender;
        _context = context;
        _current = current;
        _httpContextAccessor = httpContextAccessor;
        _sharedState = sharedState;
    }

    [Description("Lấy top công việc đang tuyển phù hợp nhất với CV mặc định của ứng viên hiện tại. Kết quả gồm điểm phù hợp, kỹ năng khớp, kỹ năng thiếu, doanh nghiệp, địa điểm và lương. Luôn gọi tool này khi user hỏi việc phù hợp hoặc việc nên ứng tuyển.")]
    public async Task<Application.Wrappers.Response<List<SuggestedJobViewModel>>> GetJobRecommendationsAsync(
        [Description("Số lượng công việc muốn lấy, từ 3 đến 10. Mặc định 10.")] int topN = 10,
        CancellationToken cancellationToken = default)
    {
        var response = await _sender.Send(new GetSuggestedJobsForCvQuery
        {
            TopN = Math.Clamp(topN, 3, 10),
        }, cancellationToken);

        if (response.Succeeded && response.Data is not null)
        {
            _sharedState.Set("jobRecommendations", response.Data);
            _sharedState.Set("lastAction", "jobRecommendationsLoaded");
        }

        return response;
    }   

    [Description("Tìm top ứng viên phù hợp nhất cho đúng một tin tuyển dụng thuộc doanh nghiệp hiện tại. Chỉ dùng khi người dùng là nhân sự hoặc người đại diện và đã xác định TinTuyenDungId.")]
    public Task<Application.Wrappers.Response<List<SuggestedCandidateViewModel>>> GetCandidateRecommendationsForJobAsync(
        [Description("Id của đúng một tin tuyển dụng cần tìm ứng viên.")] int tinTuyenDungId,
        [Description("Số lượng ứng viên muốn lấy, từ 3 đến 20. Mặc định 10.")] int topN = 10,
        CancellationToken cancellationToken = default)
    {
        return GetCandidateRecommendationsForManagedJobAsync(tinTuyenDungId, topN, cancellationToken);
    }

    private async Task<Response<List<SuggestedCandidateViewModel>>> GetCandidateRecommendationsForManagedJobAsync(
        int tinTuyenDungId, int topN, CancellationToken cancellationToken)
    {
        var job = await GetRecruitmentJobDetailAsync(tinTuyenDungId, cancellationToken);
        if (!job.Succeeded) return new Response<List<SuggestedCandidateViewModel>>(job.Message);
        return await _sender.Send(new GetSuggestedCandidatesForJobQuery
        {
            TinTuyenDungId = tinTuyenDungId,
            TopN = Math.Clamp(topN, 3, 20),
        }, cancellationToken);
    }

    [Description("Lấy danh sách tóm tắt tin tuyển dụng thuộc doanh nghiệp hiện tại để hiển thị hoặc cho người dùng chọn. Dùng trực tiếp khi người dùng yêu cầu xem/liệt kê danh sách tin. Không trả kỹ năng; muốn xem kỹ năng hoặc JD thì gọi tool chi tiết sau khi đã có TinTuyenDungId.")]
    public async Task<Application.Wrappers.Response<List<RecruitmentJobOption>>> GetMyRecruitmentJobsAsync(
        CancellationToken cancellationToken = default)
    {
        var current = await _current.ResolveAsync();
        if (current.VaiTro is not (VaiTroNguoiDung.NHAN_SU or VaiTroNguoiDung.NGUOI_DAI_DIEN))
            return new Application.Wrappers.Response<List<RecruitmentJobOption>>("Chức năng này chỉ dành cho nhân sự hoặc người đại diện.");
        if (!current.DoanhNghiepId.HasValue)
            return new Application.Wrappers.Response<List<RecruitmentJobOption>>("Tài khoản chưa thuộc doanh nghiệp nào.");

        var jobs = await _context.TinTuyenDungs.AsNoTracking()
            .Where(x => x.DoanhNghiepId == current.DoanhNghiepId.Value &&
                        x.TrangThai != TrangThaiTinTuyenDung.DaDong &&
                        x.TrangThai != TrangThaiTinTuyenDung.HetHan &&
                        (current.VaiTro != VaiTroNguoiDung.NHAN_SU || x.NguoiDangTinId == current.Id))
            .OrderByDescending(x => x.Created)
            .Take(50)
            .Select(x => new RecruitmentJobOption
            {
                TinTuyenDungId = x.Id,
                TieuDe = x.TieuDe,
                TrangThai = x.TrangThai.ToString(),
                DiaDiemLamViec = x.DiaDiemLamViec,
                LuongToiThieu = x.LuongToiThieu,
                LuongToiDa = x.LuongToiDa
            })
            .ToListAsync(cancellationToken);

        _sharedState.Set("recruitmentJobs", jobs);
        _sharedState.Set("lastAction", "get_my_recruitment_jobs");
        return new Application.Wrappers.Response<List<RecruitmentJobOption>>(jobs);
    }

    [Description("Lấy context tuyển dụng hiện tại của nhân sự/người đại diện: màn hình đang mở và danh sách tin tuyển dụng thuộc doanh nghiệp. Dùng tool này khi người dùng nói 'tin đang đăng hiện tại', 'tin này' hoặc yêu cầu liệt kê tin để chọn một tin. Nếu chỉ có một tin đang đăng thì dùng ngay tin đó.")]
    public async Task<Application.Wrappers.Response<CurrentRecruitmentContext>> GetCurrentRecruitmentContextAsync(
        CancellationToken cancellationToken = default)
    {
        var current = await _current.ResolveAsync();
        if (current.VaiTro is not (VaiTroNguoiDung.NHAN_SU or VaiTroNguoiDung.NGUOI_DAI_DIEN))
            return new Application.Wrappers.Response<CurrentRecruitmentContext>("Chức năng này chỉ dành cho nhân sự hoặc người đại diện.");
        if (!current.DoanhNghiepId.HasValue)
            return new Application.Wrappers.Response<CurrentRecruitmentContext>("Tài khoản chưa thuộc doanh nghiệp nào.");

        var jobs = await _context.TinTuyenDungs.AsNoTracking()
            .Include(x => x.KyNangTinTuyenDungs)
                .ThenInclude(x => x.KyNang)
            .Where(x => x.DoanhNghiepId == current.DoanhNghiepId.Value &&
                        x.TrangThai == TrangThaiTinTuyenDung.DangTuyen &&
                        (x.NgayHetHan == null || x.NgayHetHan > DateTime.UtcNow) &&
                        (current.VaiTro != VaiTroNguoiDung.NHAN_SU || x.NguoiDangTinId == current.Id))
            .OrderByDescending(x => x.Created)
            .Take(50)
            .Select(x => new RecruitmentJobOption
            {
                TinTuyenDungId = x.Id,
                TieuDe = x.TieuDe,
                TrangThai = x.TrangThai.ToString(),
                DiaDiemLamViec = x.DiaDiemLamViec,
                LuongToiThieu = x.LuongToiThieu,
                LuongToiDa = x.LuongToiDa,
                KyNang = x.KyNangTinTuyenDungs
                    .Where(k => k.KyNang != null)
                    .Select(k => k.KyNang!.TenKyNang)
                    .ToList()
            })
            .ToListAsync(cancellationToken);

        return new Application.Wrappers.Response<CurrentRecruitmentContext>(new CurrentRecruitmentContext
        {
            Route = _httpContextAccessor.HttpContext?.Request.Headers["X-Adam-Route"].ToString() ?? string.Empty,
            DangTuyenJobs = jobs
        });
    }

    [Description("Lấy thông tin chi tiết của đúng một tin tuyển dụng thuộc doanh nghiệp hiện tại. Dùng khi người dùng muốn xem hoặc hỏi chi tiết một tin.")]
    public async Task<Application.Wrappers.Response<RecruitmentJobDetail>> GetRecruitmentJobDetailAsync(
        [Description("Id của một tin tuyển dụng cần xem chi tiết.")] int tinTuyenDungId,
        CancellationToken cancellationToken = default)
    {
        var current = await _current.ResolveAsync();
        if (current.VaiTro is not (VaiTroNguoiDung.NHAN_SU or VaiTroNguoiDung.NGUOI_DAI_DIEN))
            return new Application.Wrappers.Response<RecruitmentJobDetail>("Chức năng này chỉ dành cho nhân sự hoặc người đại diện.");
        if (!current.DoanhNghiepId.HasValue)
            return new Application.Wrappers.Response<RecruitmentJobDetail>("Tài khoản chưa thuộc doanh nghiệp nào.");

        var job = await _context.TinTuyenDungs.AsNoTracking()
            .Include(x => x.KyNangTinTuyenDungs)
                .ThenInclude(x => x.KyNang)
            .Where(x => x.Id == tinTuyenDungId && x.DoanhNghiepId == current.DoanhNghiepId.Value &&
                        (current.VaiTro != VaiTroNguoiDung.NHAN_SU || x.NguoiDangTinId == current.Id))
            .Select(x => new RecruitmentJobDetail
            {
                TinTuyenDungId = x.Id,
                TieuDe = x.TieuDe,
                MoTaCongViec = x.MoTaCongViec,
                KinhNghiemYeuCau = x.KinhNghiemYeuCau,
                YeuCauCongViec = x.YeuCauCongViec,
                QuyenLoi = x.QuyenLoi,
                DiaDiemLamViec = x.DiaDiemLamViec,
                LuongToiThieu = x.LuongToiThieu,
                LuongToiDa = x.LuongToiDa,
                TrangThai = x.TrangThai.ToString(),
                NgayHetHan = x.NgayHetHan,
                KyNang = x.KyNangTinTuyenDungs
                    .Where(k => k.KyNang != null)
                    .Select(k => k.KyNang!.TenKyNang)
                    .ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        return job == null
            ? new Application.Wrappers.Response<RecruitmentJobDetail>("Không tìm thấy tin tuyển dụng thuộc doanh nghiệp của bạn.")
            : new Application.Wrappers.Response<RecruitmentJobDetail>(job);
    }

    [Description("Lấy chi tiết một tin tuyển dụng thuộc phạm vi doanh nghiệp hiện tại.")]
    public Task<Response<RecruitmentJobDetail>> GetJobPostDetailAsync(
        [Description("ID tin tuyển dụng cần xem.")] int tinTuyenDungId,
        CancellationToken cancellationToken = default)
        => GetRecruitmentJobDetailAsync(tinTuyenDungId, cancellationToken);

    [Description("Phân tích chất lượng JD của một tin thuộc doanh nghiệp hiện tại dựa trên các trường dữ liệu thật. Không tự sửa tin.")]
    public async Task<Response<JobPostAnalysis>> AnalyzeJobPostAsync(
        [Description("ID tin tuyển dụng cần phân tích.")] int tinTuyenDungId,
        CancellationToken cancellationToken = default)
    {
        var job = await GetRecruitmentJobDetailAsync(tinTuyenDungId, cancellationToken);
        if (!job.Succeeded || job.Data == null) return new Response<JobPostAnalysis>(job.Message);

        var missing = new List<string>();
        if (string.IsNullOrWhiteSpace(job.Data.MoTaCongViec)) missing.Add("mô tả công việc");
        if (string.IsNullOrWhiteSpace(job.Data.YeuCauCongViec)) missing.Add("yêu cầu công việc");
        if (string.IsNullOrWhiteSpace(job.Data.KinhNghiemYeuCau)) missing.Add("yêu cầu kinh nghiệm");
        if (string.IsNullOrWhiteSpace(job.Data.QuyenLoi)) missing.Add("quyền lợi");
        if (string.IsNullOrWhiteSpace(job.Data.DiaDiemLamViec)) missing.Add("địa điểm làm việc");
        if (job.Data.LuongToiThieu <= 0 && job.Data.LuongToiDa <= 0) missing.Add("mức lương");
        if (job.Data.KyNang.Count == 0) missing.Add("kỹ năng yêu cầu");

        return new Response<JobPostAnalysis>(new JobPostAnalysis
        {
            TinTuyenDungId = job.Data.TinTuyenDungId,
            IsComplete = missing.Count == 0,
            MissingSections = missing,
            Suggestions = missing.Select(x => $"Bổ sung {x} cụ thể, có thể kiểm chứng.").ToList()
        });
    }

    [Description("Đề xuất cải thiện JD của một tin thuộc doanh nghiệp hiện tại. Chỉ trả đề xuất, không tự sửa tin.")]
    public Task<Response<JobPostAnalysis>> SuggestJobPostImprovementAsync(
        [Description("ID tin tuyển dụng cần cải thiện.")] int tinTuyenDungId,
        CancellationToken cancellationToken = default)
        => AnalyzeJobPostAsync(tinTuyenDungId, cancellationToken);

    [Description("Giải thích dữ liệu match thật của một ứng viên với một tin thuộc doanh nghiệp hiện tại.")]
    public async Task<Response<SuggestedCandidateViewModel>> ExplainCandidateMatchAsync(
        [Description("ID tin tuyển dụng.")] int tinTuyenDungId,
        [Description("ID hồ sơ ứng viên.")] int hoSoUngVienId,
        CancellationToken cancellationToken = default)
    {
        var matches = await GetCandidateRecommendationsForJobAsync(tinTuyenDungId, 20, cancellationToken);
        var candidate = matches.Data?.FirstOrDefault(x => x.HoSoUngVienId == hoSoUngVienId);
        return candidate == null
            ? new Response<SuggestedCandidateViewModel>("Chưa có kết quả phù hợp cho ứng viên này trong tin tuyển dụng đã chọn.")
            : new Response<SuggestedCandidateViewModel>(candidate);
    }

    [Description("So sánh từ hai đến ba ứng viên theo kết quả match thật của cùng một tin tuyển dụng thuộc doanh nghiệp hiện tại.")]
    public async Task<Response<List<SuggestedCandidateViewModel>>> CompareCandidatesAsync(
        [Description("ID tin tuyển dụng để so sánh.")] int tinTuyenDungId,
        [Description("Danh sách 2 đến 3 ID hồ sơ ứng viên.")] List<int> hoSoUngVienIds,
        CancellationToken cancellationToken = default)
    {
        var ids = hoSoUngVienIds.Distinct().Take(3).ToHashSet();
        if (ids.Count < 2) return new Response<List<SuggestedCandidateViewModel>>("Hãy cung cấp từ hai đến ba ứng viên để so sánh.");
        var matches = await GetCandidateRecommendationsForJobAsync(tinTuyenDungId, 20, cancellationToken);
        return new Response<List<SuggestedCandidateViewModel>>(matches.Data?.Where(x => ids.Contains(x.HoSoUngVienId)).ToList() ?? []);
    }

    [Description("Đọc bản tóm tắt CV của ứng viên chỉ khi CV đó đã được dùng trong đơn ứng tuyển thuộc doanh nghiệp hiện tại.")]
    public async Task<Response<CandidateCvSummary>> GetCandidateCVAsync(
        [Description("ID CV ứng viên cần đọc.")] int cvUngVienId,
        CancellationToken cancellationToken = default)
    {
        var company = await GetCompanyIdAsync(cancellationToken);
        if (!company.Succeeded) return new Response<CandidateCvSummary>(company.Message);
        var cv = await _context.CVUngViens.AsNoTracking()
            .Include(x => x.HoSoUngVien)
            .Include(x => x.KyNangs)
            .Include(x => x.KinhNghiems)
            .Include(x => x.HocVans)
            .Include(x => x.DuAns)
            .FirstOrDefaultAsync(x => x.Id == cvUngVienId && !x.IsDaXoa &&
                _context.DonUngTuyens.Any(d => d.CVUngVienId == x.Id && d.TinTuyenDung.DoanhNghiepId == company.Data), cancellationToken);
        if (cv == null) return new Response<CandidateCvSummary>("Không tìm thấy CV trong phạm vi đơn ứng tuyển của doanh nghiệp.");

        return new Response<CandidateCvSummary>(new CandidateCvSummary
        {
            CvUngVienId = cv.Id,
            HoSoUngVienId = cv.HoSoUngVienId,
            HoTen = cv.HoSoUngVien?.HoTen ?? string.Empty,
            ViTriUngTuyen = cv.HoSoUngVien?.ViTriUngTuyen ?? string.Empty,
            KyNang = cv.KyNangs.Select(x => x.TenKyNang).Where(x => !string.IsNullOrWhiteSpace(x)).ToList(),
            SoKinhNghiem = cv.KinhNghiems.Count,
            SoHocVan = cv.HocVans.Count,
            SoDuAn = cv.DuAns.Count
        });
    }

    [Description("Tóm tắt ứng viên từ CV đã dùng trong đơn thuộc doanh nghiệp hiện tại.")]
    public async Task<Response<CandidateCvSummary>> SummarizeCandidateAsync(
        [Description("ID hồ sơ ứng viên cần tóm tắt.")] int hoSoUngVienId,
        CancellationToken cancellationToken = default)
    {
        var company = await GetCompanyIdAsync(cancellationToken);
        if (!company.Succeeded) return new Response<CandidateCvSummary>(company.Message);
        var cvId = await _context.DonUngTuyens.AsNoTracking()
            .Where(x => x.TinTuyenDung.DoanhNghiepId == company.Data && x.CVUngVien.HoSoUngVienId == hoSoUngVienId)
            .OrderByDescending(x => x.NgayUngTuyen)
            .Select(x => x.CVUngVienId).FirstOrDefaultAsync(cancellationToken);
        return cvId == 0
            ? new Response<CandidateCvSummary>("Ứng viên chưa có đơn thuộc doanh nghiệp.")
            : await GetCandidateCVAsync(cvId, cancellationToken);
    }

    [Description("Lấy danh sách đơn ứng tuyển thuộc các tin trong phạm vi doanh nghiệp hiện tại.")]
    public async Task<Response<List<RecruitmentApplication>>> GetApplicationsAsync(
        [Description("Có thể lọc theo ID tin tuyển dụng.")] int? tinTuyenDungId = null,
        [Description("Số đơn trả về, từ 1 đến 50.")] int topN = 20,
        CancellationToken cancellationToken = default)
    {
        var company = await GetCompanyIdAsync(cancellationToken);
        if (!company.Succeeded) return new Response<List<RecruitmentApplication>>(company.Message);
        var query = _context.DonUngTuyens.AsNoTracking()
            .Where(x => x.TinTuyenDung.DoanhNghiepId == company.Data);
        if (tinTuyenDungId.HasValue) query = query.Where(x => x.TinTuyenDungId == tinTuyenDungId.Value);
        var items = await query.OrderByDescending(x => x.NgayUngTuyen ?? x.Created)
            .Take(Math.Clamp(topN, 1, 50))
            .Select(x => new RecruitmentApplication
            {
                DonUngTuyenId = x.Id,
                TinTuyenDungId = x.TinTuyenDungId,
                TieuDeTin = x.TinTuyenDung.TieuDe,
                HoSoUngVienId = x.CVUngVien.HoSoUngVienId,
                HoTenUngVien = x.CVUngVien.HoSoUngVien.HoTen,
                TrangThai = x.TrangThai.ToString(),
                NgayUngTuyen = x.NgayUngTuyen,
                NguoiXuLyId = x.NguoiXuLyId
            }).ToListAsync(cancellationToken);
        return new Response<List<RecruitmentApplication>>(items);
    }

    [Description("Lấy chi tiết một đơn ứng tuyển thuộc doanh nghiệp hiện tại.")]
    public async Task<Response<RecruitmentApplication>> GetApplicationDetailAsync(
        [Description("ID đơn ứng tuyển cần xem.")] int donUngTuyenId,
        CancellationToken cancellationToken = default)
    {
        var company = await GetCompanyIdAsync(cancellationToken);
        if (!company.Succeeded) return new Response<RecruitmentApplication>(company.Message);
        var item = await _context.DonUngTuyens.AsNoTracking()
            .Where(x => x.Id == donUngTuyenId && x.TinTuyenDung.DoanhNghiepId == company.Data)
            .Select(x => new RecruitmentApplication
            {
                DonUngTuyenId = x.Id,
                TinTuyenDungId = x.TinTuyenDungId,
                TieuDeTin = x.TinTuyenDung.TieuDe,
                HoSoUngVienId = x.CVUngVien.HoSoUngVienId,
                HoTenUngVien = x.CVUngVien.HoSoUngVien.HoTen,
                TrangThai = x.TrangThai.ToString(),
                GhiChu = x.GhiChu,
                NgayUngTuyen = x.NgayUngTuyen,
                NguoiXuLyId = x.NguoiXuLyId
            }).FirstOrDefaultAsync(cancellationToken);
        return item == null
            ? new Response<RecruitmentApplication>("Không tìm thấy đơn ứng tuyển thuộc doanh nghiệp.")
            : new Response<RecruitmentApplication>(item);
    }

    [Description("Thống kê pipeline đơn ứng tuyển theo trạng thái trong phạm vi doanh nghiệp hiện tại.")]
    public async Task<Response<List<ApplicationPipelineStage>>> GetApplicationPipelineAsync(
        [Description("Có thể lọc theo ID tin tuyển dụng.")] int? tinTuyenDungId = null,
        CancellationToken cancellationToken = default)
    {
        var company = await GetCompanyIdAsync(cancellationToken);
        if (!company.Succeeded) return new Response<List<ApplicationPipelineStage>>(company.Message);
        var query = _context.DonUngTuyens.AsNoTracking().Where(x => x.TinTuyenDung.DoanhNghiepId == company.Data);
        if (tinTuyenDungId.HasValue) query = query.Where(x => x.TinTuyenDungId == tinTuyenDungId.Value);
        var stages = await query.GroupBy(x => x.TrangThai)
            .Select(x => new ApplicationPipelineStage { TrangThai = x.Key.ToString(), SoLuong = x.Count() })
            .OrderByDescending(x => x.SoLuong).ToListAsync(cancellationToken);
        return new Response<List<ApplicationPipelineStage>>(stages);
    }

    [Description("Tìm đơn ứng tuyển đã chờ xử lý quá số ngày chỉ định trong phạm vi doanh nghiệp hiện tại.")]
    public async Task<Response<List<RecruitmentApplication>>> FindStaleApplicationsAsync(
        [Description("Số ngày chưa xử lý tối thiểu, từ 1 đến 90. Mặc định 7.")] int days = 7,
        CancellationToken cancellationToken = default)
    {
        var company = await GetCompanyIdAsync(cancellationToken);
        if (!company.Succeeded) return new Response<List<RecruitmentApplication>>(company.Message);
        var cutoff = DateTime.UtcNow.AddDays(-Math.Clamp(days, 1, 90));
        var items = await _context.DonUngTuyens.AsNoTracking()
            .Where(x => x.TinTuyenDung.DoanhNghiepId == company.Data &&
                x.TrangThai == TrangThaiDonUngTuyen.ChoXuLy && (x.NgayUngTuyen ?? x.Created) <= cutoff)
            .OrderBy(x => x.NgayUngTuyen ?? x.Created).Take(50)
            .Select(x => new RecruitmentApplication
            {
                DonUngTuyenId = x.Id, TinTuyenDungId = x.TinTuyenDungId, TieuDeTin = x.TinTuyenDung.TieuDe,
                HoSoUngVienId = x.CVUngVien.HoSoUngVienId, HoTenUngVien = x.CVUngVien.HoSoUngVien.HoTen,
                TrangThai = x.TrangThai.ToString(), NgayUngTuyen = x.NgayUngTuyen, NguoiXuLyId = x.NguoiXuLyId
            }).ToListAsync(cancellationToken);
        return new Response<List<RecruitmentApplication>>(items);
    }

    [Description("Lấy tổng quan tuyển dụng của doanh nghiệp. Chỉ người đại diện được dùng.")]
    public async Task<Response<RecruitmentOverview>> GetRecruitmentOverviewAsync(CancellationToken cancellationToken = default)
    {
        var company = await GetRepresentativeCompanyIdAsync(cancellationToken);
        if (!company.Succeeded) return new Response<RecruitmentOverview>(company.Message);
        var jobs = _context.TinTuyenDungs.AsNoTracking().Where(x => x.DoanhNghiepId == company.Data);
        var applications = _context.DonUngTuyens.AsNoTracking().Where(x => x.TinTuyenDung.DoanhNghiepId == company.Data);
        return new Response<RecruitmentOverview>(new RecruitmentOverview
        {
            TongTin = await jobs.CountAsync(cancellationToken),
            TinDangTuyen = await jobs.CountAsync(x => x.TrangThai == TrangThaiTinTuyenDung.DangTuyen, cancellationToken),
            TongDon = await applications.CountAsync(cancellationToken),
            DonChoXuLy = await applications.CountAsync(x => x.TrangThai == TrangThaiDonUngTuyen.ChoXuLy, cancellationToken)
        });
    }

    [Description("Lấy thống kê tuyển dụng toàn doanh nghiệp. Chỉ người đại diện được dùng.")]
    public async Task<Response<CompanyRecruitmentStats>> GetCompanyRecruitmentStatsAsync(CancellationToken cancellationToken = default)
    {
        var company = await GetRepresentativeCompanyIdAsync(cancellationToken);
        if (!company.Succeeded) return new Response<CompanyRecruitmentStats>(company.Message);
        var since = DateTime.UtcNow.AddDays(-30);
        var jobs = _context.TinTuyenDungs.AsNoTracking().Where(x => x.DoanhNghiepId == company.Data);
        var apps = _context.DonUngTuyens.AsNoTracking().Where(x => x.TinTuyenDung.DoanhNghiepId == company.Data);
        return new Response<CompanyRecruitmentStats>(new CompanyRecruitmentStats
        {
            TinTao30Ngay = await jobs.CountAsync(x => x.Created >= since, cancellationToken),
            DonNhan30Ngay = await apps.CountAsync(x => (x.NgayUngTuyen ?? x.Created) >= since, cancellationToken),
            DonPhuHop = await apps.CountAsync(x => x.TrangThai == TrangThaiDonUngTuyen.PhuHop, cancellationToken),
            DonTuChoi = await apps.CountAsync(x => x.TrangThai == TrangThaiDonUngTuyen.TuChoi, cancellationToken)
        });
    }

    [Description("Lấy danh sách nhân sự và người đại diện thuộc doanh nghiệp hiện tại. Chỉ người đại diện được dùng.")]
    public async Task<Response<List<CompanyMember>>> GetCompanyMembersAsync(CancellationToken cancellationToken = default)
    {
        var company = await GetRepresentativeCompanyIdAsync(cancellationToken);
        if (!company.Succeeded) return new Response<List<CompanyMember>>(company.Message);
        var members = await _context.HoSoNhaTuyenDungs.AsNoTracking()
            .Where(x => x.DoanhNghiepId == company.Data)
            .Select(x => new CompanyMember
            {
                NguoiDungId = x.NguoiDungId,
                HoTen = x.HoTen,
                ChucVu = x.ChucVu,
                VaiTro = x.NguoiDung.VaiTro.ToString()
            }).ToListAsync(cancellationToken);
        return new Response<List<CompanyMember>>(members);
    }

    [Description("Lấy hoạt động tuyển dụng tổng hợp của một nhân sự trong doanh nghiệp. Chỉ người đại diện được dùng.")]
    public async Task<Response<RecruiterActivity>> GetRecruiterActivityAsync(
        [Description("ID người dùng nhân sự cần xem hoạt động.")] int nguoiDungId,
        CancellationToken cancellationToken = default)
    {
        var company = await GetRepresentativeCompanyIdAsync(cancellationToken);
        if (!company.Succeeded) return new Response<RecruiterActivity>(company.Message);
        var member = await _context.HoSoNhaTuyenDungs.AsNoTracking()
            .FirstOrDefaultAsync(x => x.DoanhNghiepId == company.Data && x.NguoiDungId == nguoiDungId, cancellationToken);
        if (member == null) return new Response<RecruiterActivity>("Không tìm thấy nhân sự thuộc doanh nghiệp.");

        var jobs = _context.TinTuyenDungs.AsNoTracking()
            .Where(x => x.DoanhNghiepId == company.Data && x.NguoiDangTinId == nguoiDungId);
        var handled = _context.DonUngTuyens.AsNoTracking()
            .Where(x => x.TinTuyenDung.DoanhNghiepId == company.Data && x.NguoiXuLyId == nguoiDungId);
        return new Response<RecruiterActivity>(new RecruiterActivity
        {
            NguoiDungId = nguoiDungId,
            HoTen = member.HoTen,
            TinDaDang = await jobs.CountAsync(cancellationToken),
            DonDaXuLy = await handled.CountAsync(cancellationToken),
            DonDanhGiaPhuHop = await handled.CountAsync(x => x.TrangThai == TrangThaiDonUngTuyen.PhuHop, cancellationToken),
            DonTuChoi = await handled.CountAsync(x => x.TrangThai == TrangThaiDonUngTuyen.TuChoi, cancellationToken)
        });
    }

    private async Task<Response<int>> GetCompanyIdAsync(CancellationToken cancellationToken)
    {
        var current = await _current.ResolveAsync();
        if (current.VaiTro is not (VaiTroNguoiDung.NHAN_SU or VaiTroNguoiDung.NGUOI_DAI_DIEN))
            return new Response<int>("Chức năng này chỉ dành cho nhân sự hoặc người đại diện.");
        return current.DoanhNghiepId.HasValue
            ? new Response<int>(current.DoanhNghiepId.Value)
            : new Response<int>("Tài khoản chưa thuộc doanh nghiệp nào.");
    }

    private async Task<Response<int>> GetRepresentativeCompanyIdAsync(CancellationToken cancellationToken)
    {
        var current = await _current.ResolveAsync();
        if (current.VaiTro != VaiTroNguoiDung.NGUOI_DAI_DIEN)
            return new Response<int>("Chức năng này chỉ dành cho người đại diện doanh nghiệp.");
        return current.DoanhNghiepId.HasValue
            ? new Response<int>(current.DoanhNghiepId.Value)
            : new Response<int>("Tài khoản chưa thuộc doanh nghiệp nào.");
    }
}

public sealed class RecruitmentJobOption
{
    public int TinTuyenDungId { get; set; }
    public string TieuDe { get; set; } = string.Empty;
    public string TrangThai { get; set; } = string.Empty;
    public string DiaDiemLamViec { get; set; } = string.Empty;
    public decimal LuongToiThieu { get; set; }
    public decimal LuongToiDa { get; set; }
    public List<string> KyNang { get; set; } = new();
}

public sealed class CurrentRecruitmentContext
{
    public string Route { get; set; } = string.Empty;
    public List<RecruitmentJobOption> DangTuyenJobs { get; set; } = new();
}

public sealed class RecruitmentJobDetail
{
    public int TinTuyenDungId { get; set; }
    public string TieuDe { get; set; } = string.Empty;
    public string MoTaCongViec { get; set; } = string.Empty;
    public string KinhNghiemYeuCau { get; set; } = string.Empty;
    public string YeuCauCongViec { get; set; } = string.Empty;
    public string QuyenLoi { get; set; } = string.Empty;
    public string DiaDiemLamViec { get; set; } = string.Empty;
    public decimal LuongToiThieu { get; set; }
    public decimal LuongToiDa { get; set; }
    public string TrangThai { get; set; } = string.Empty;
    public DateTime? NgayHetHan { get; set; }
    public List<string> KyNang { get; set; } = new();
}

public sealed class JobPostAnalysis
{
    public int TinTuyenDungId { get; set; }
    public bool IsComplete { get; set; }
    public List<string> MissingSections { get; set; } = new();
    public List<string> Suggestions { get; set; } = new();
}

public sealed class CandidateCvSummary
{
    public int CvUngVienId { get; set; }
    public int HoSoUngVienId { get; set; }
    public string HoTen { get; set; } = string.Empty;
    public string ViTriUngTuyen { get; set; } = string.Empty;
    public List<string> KyNang { get; set; } = new();
    public int SoKinhNghiem { get; set; }
    public int SoHocVan { get; set; }
    public int SoDuAn { get; set; }
}

public sealed class RecruitmentApplication
{
    public int DonUngTuyenId { get; set; }
    public int TinTuyenDungId { get; set; }
    public string TieuDeTin { get; set; } = string.Empty;
    public int HoSoUngVienId { get; set; }
    public string HoTenUngVien { get; set; } = string.Empty;
    public string TrangThai { get; set; } = string.Empty;
    public string? GhiChu { get; set; }
    public DateTime? NgayUngTuyen { get; set; }
    public int NguoiXuLyId { get; set; }
}

public sealed class ApplicationPipelineStage
{
    public string TrangThai { get; set; } = string.Empty;
    public int SoLuong { get; set; }
}

public sealed class RecruitmentOverview
{
    public int TongTin { get; set; }
    public int TinDangTuyen { get; set; }
    public int TongDon { get; set; }
    public int DonChoXuLy { get; set; }
}

public sealed class CompanyRecruitmentStats
{
    public int TinTao30Ngay { get; set; }
    public int DonNhan30Ngay { get; set; }
    public int DonPhuHop { get; set; }
    public int DonTuChoi { get; set; }
}

public sealed class CompanyMember
{
    public int NguoiDungId { get; set; }
    public string HoTen { get; set; } = string.Empty;
    public string ChucVu { get; set; } = string.Empty;
    public string VaiTro { get; set; } = string.Empty;
}

public sealed class RecruiterActivity
{
    public int NguoiDungId { get; set; }
    public string HoTen { get; set; } = string.Empty;
    public int TinDaDang { get; set; }
    public int DonDaXuLy { get; set; }
    public int DonDanhGiaPhuHop { get; set; }
    public int DonTuChoi { get; set; }
}
