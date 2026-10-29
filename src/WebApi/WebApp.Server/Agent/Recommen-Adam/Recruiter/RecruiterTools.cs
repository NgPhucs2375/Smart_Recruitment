using System.ComponentModel;
using Application.DTOs.Recruiter;
using Application.Features.KetQuaPhuHop.Queries.SuggestCandidatesForJob;
using Application.Features.KetQuaPhuHop.Queries.SuggestJobsForCv;
using Application.Features.Recruiter.Queries.GetCompanyMembers;
using Application.Features.Recruiter.Queries.GetCompanyRecruitmentStats;
using Application.Features.Recruiter.Queries.GetRecruiterActivity;
using Application.Features.Recruiter.Queries.GetRecruiterApplicationPipeline;
using Application.Features.Recruiter.Queries.GetRecruiterApplications;
using Application.Features.Recruiter.Queries.GetRecruiterJobDetail;
using Application.Features.Recruiter.Queries.GetRecruiterJobs;
using Application.Features.Recruiter.Queries.GetRecruiterOverview;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using WebApp.Server.Agent.Cache;
using WebApp.Server.Agent.SharedState;

namespace WebApp.Server.Agent.RecommenAdam.Recruiter.Tools;

internal sealed class RecruiterTools
{
    private readonly ISender _sender;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly SharedStateStore _sharedState;
    private readonly IPermissionService _permissions;
    private readonly AgentToolCache _toolCache;

    public RecruiterTools(
        ISender sender,
        IHttpContextAccessor httpContextAccessor,
        SharedStateStore sharedState, IPermissionService permissions,
        AgentToolCache toolCache)
    {
        _sender = sender;
        _httpContextAccessor = httpContextAccessor;
        _sharedState = sharedState;
        _permissions = permissions;
        _toolCache = toolCache;
    }

    [Description("Lấy top công việc đang tuyển phù hợp nhất với CV mặc định của ứng viên hiện tại. Kết quả gồm điểm phù hợp, kỹ năng khớp, kỹ năng thiếu, doanh nghiệp, địa điểm và lương. Luôn gọi tool này khi user hỏi việc phù hợp hoặc việc nên ứng tuyển.")]
    public Task<Application.Wrappers.Response<List<SuggestedJobViewModel>>> GetJobRecommendationsAsync(
        [Description("Số lượng công việc muốn lấy, từ 3 đến 10. Mặc định 10.")] int topN = 10,
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "recruiter_get_job_recommendations", new { topN },
            () => GetJobRecommendationsCoreAsync(topN, cancellationToken),
            cancellationToken);

    private async Task<Application.Wrappers.Response<List<SuggestedJobViewModel>>> GetJobRecommendationsCoreAsync(
        int topN,
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("ketquaphuhops", "list", cancellationToken);
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
        => _toolCache.GetOrCreateAsync(
            "get_candidate_recommendations_for_job", new { tinTuyenDungId, topN },
            () => GetCandidateRecommendationsForManagedJobAsync(tinTuyenDungId, topN, cancellationToken),
            cancellationToken);

    private async Task<Response<List<SuggestedCandidateViewModel>>> GetCandidateRecommendationsForManagedJobAsync(
        int tinTuyenDungId, int topN, CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("ketquaphuhops", "list", cancellationToken);
        var job = await GetRecruitmentJobDetailAsync(tinTuyenDungId, cancellationToken);
        if (!job.Succeeded) return new Response<List<SuggestedCandidateViewModel>>(job.Message);
        return await _sender.Send(new GetSuggestedCandidatesForJobQuery
        {
            TinTuyenDungId = tinTuyenDungId,
            TopN = Math.Clamp(topN, 3, 20),
        }, cancellationToken);
    }

    [Description("Lấy danh sách tóm tắt tin tuyển dụng thuộc doanh nghiệp hiện tại để hiển thị hoặc cho người dùng chọn. Dùng trực tiếp khi người dùng yêu cầu xem/liệt kê danh sách tin. Không trả kỹ năng; muốn xem kỹ năng hoặc JD thì gọi tool chi tiết sau khi đã có TinTuyenDungId.")]
    public Task<Application.Wrappers.Response<List<RecruitmentJobOption>>> GetMyRecruitmentJobsAsync(
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "get_my_recruitment_jobs", null,
            () => GetMyRecruitmentJobsCoreAsync(cancellationToken),
            cancellationToken);

    private async Task<Application.Wrappers.Response<List<RecruitmentJobOption>>> GetMyRecruitmentJobsCoreAsync(
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("tintuyendungs", "list", cancellationToken);
        var response = await _sender.Send(
            new GetRecruiterJobsQuery { Mode = RecruiterJobListMode.Manageable },
            cancellationToken);

        if (response.Succeeded)
        {
            _sharedState.Set("recruitmentJobs", response.Data);
            _sharedState.Set("lastAction", "get_my_recruitment_jobs");
        }

        return response;
    }

    [Description("Lấy context tuyển dụng hiện tại của nhân sự/người đại diện: màn hình đang mở và danh sách tin tuyển dụng thuộc doanh nghiệp. Dùng tool này khi người dùng nói 'tin đang đăng hiện tại', 'tin này' hoặc yêu cầu liệt kê tin để chọn một tin. Nếu chỉ có một tin đang đăng thì dùng ngay tin đó.")]
    public async Task<Application.Wrappers.Response<CurrentRecruitmentContext>> GetCurrentRecruitmentContextAsync(
        CancellationToken cancellationToken = default)
    {
        await _permissions.RequireAsync("tintuyendungs", "list", cancellationToken);
        var jobs = await _sender.Send(
            new GetRecruiterJobsQuery { Mode = RecruiterJobListMode.ActiveWithSkills },
            cancellationToken);

        if (!jobs.Succeeded)
            return new Application.Wrappers.Response<CurrentRecruitmentContext>(jobs.Message);

        return new Application.Wrappers.Response<CurrentRecruitmentContext>(new CurrentRecruitmentContext
        {
            Route = _httpContextAccessor.HttpContext?.Request.Headers["X-Adam-Route"].ToString() ?? string.Empty,
            DangTuyenJobs = jobs.Data ?? []
        });
    }

    [Description("Lấy thông tin chi tiết của đúng một tin tuyển dụng thuộc doanh nghiệp hiện tại. Dùng khi người dùng muốn xem hoặc hỏi chi tiết một tin.")]
    public Task<Application.Wrappers.Response<RecruitmentJobDetail>> GetRecruitmentJobDetailAsync(
        [Description("Id của một tin tuyển dụng cần xem chi tiết.")] int tinTuyenDungId,
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "get_recruitment_job_detail", new { tinTuyenDungId },
            () => GetRecruitmentJobDetailCoreAsync(tinTuyenDungId, cancellationToken),
            cancellationToken);

    private async Task<Application.Wrappers.Response<RecruitmentJobDetail>> GetRecruitmentJobDetailCoreAsync(
        int tinTuyenDungId,
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("tintuyendungs", "show", cancellationToken);
        return await _sender.Send(
            new GetRecruiterJobDetailQuery { TinTuyenDungId = tinTuyenDungId },
            cancellationToken);
    }

    [Description("Lấy chi tiết một tin tuyển dụng thuộc phạm vi doanh nghiệp hiện tại.")]
    public Task<Response<RecruitmentJobDetail>> GetJobPostDetailAsync(
        [Description("ID tin tuyển dụng cần xem.")] int tinTuyenDungId,
        CancellationToken cancellationToken = default)
        => GetRecruitmentJobDetailAsync(tinTuyenDungId, cancellationToken);

    [Description("Phân tích chất lượng JD của một tin thuộc doanh nghiệp hiện tại dựa trên các trường dữ liệu thật. Không tự sửa tin.")]
    public Task<Response<JobPostAnalysis>> AnalyzeJobPostAsync(
        [Description("ID tin tuyển dụng cần phân tích.")] int tinTuyenDungId,
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "analyze_job_post", new { tinTuyenDungId },
            () => AnalyzeJobPostCoreAsync(tinTuyenDungId, cancellationToken),
            cancellationToken);

    private async Task<Response<JobPostAnalysis>> AnalyzeJobPostCoreAsync(
        int tinTuyenDungId,
        CancellationToken cancellationToken)
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
    public Task<Response<CandidateCvSummary>> GetCandidateCVAsync(
        [Description("ID CV ứng viên cần đọc.")] int cvUngVienId,
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "get_candidate_cv", new { cvUngVienId },
            () => GetCandidateCVCoreAsync(cvUngVienId, cancellationToken),
            cancellationToken);

    private async Task<Response<CandidateCvSummary>> GetCandidateCVCoreAsync(
        int cvUngVienId,
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("cvungviens", "show", cancellationToken);
        var access = await _sender.Send(
            new GetRecruiterApplicationsQuery { CVUngVienId = cvUngVienId, TopN = 1 },
            cancellationToken);
        if (!access.Succeeded) return new Response<CandidateCvSummary>(access.Message);

        var application = access.Data?.FirstOrDefault();
        if (application == null) return new Response<CandidateCvSummary>("Không tìm thấy CV trong phạm vi đơn ứng tuyển của doanh nghiệp.");
        var profileId = application.HoSoUngVienId;
        var submitted = await _sender.Send(new Application.Features.CVUngVien.Queries.GetCVUngVienById.GetCVUngVienByIdQuery { Id = cvUngVienId }, cancellationToken);
        if (!submitted.Succeeded || submitted.Data?.NoiDung == null) return new Response<CandidateCvSummary>(submitted.Message ?? "Không tìm thấy bản CV đã nộp.");
        var cv = submitted.Data;

        return new Response<CandidateCvSummary>(new CandidateCvSummary
        {
            CvUngVienId = cv.Id,
            HoSoUngVienId = profileId,
            HoTen = cv.NoiDung.ThongTinLienHe?.HoTen ?? string.Empty,
            ViTriUngTuyen = cv.NoiDung.ThongTinLienHe?.ViTriUngTuyen ?? string.Empty,
            KyNang = cv.NoiDung.KyNang.Select(x => x.TenKyNang).Where(x => !string.IsNullOrWhiteSpace(x)).ToList(),
            SoKinhNghiem = cv.NoiDung.KinhNghiemLamViec.Count,
            SoHocVan = cv.NoiDung.HocVan.Count,
            SoDuAn = cv.NoiDung.DuAn.Count
        });
    }

    [Description("Tóm tắt ứng viên từ CV đã dùng trong đơn thuộc doanh nghiệp hiện tại.")]
    public Task<Response<CandidateCvSummary>> SummarizeCandidateAsync(
        [Description("ID hồ sơ ứng viên cần tóm tắt.")] int hoSoUngVienId,
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "summarize_candidate", new { hoSoUngVienId },
            () => SummarizeCandidateCoreAsync(hoSoUngVienId, cancellationToken),
            cancellationToken);

    private async Task<Response<CandidateCvSummary>> SummarizeCandidateCoreAsync(
        int hoSoUngVienId,
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("cvungviens", "show", cancellationToken);
        var access = await _sender.Send(
            new GetRecruiterApplicationsQuery { HoSoUngVienId = hoSoUngVienId, TopN = 1 },
            cancellationToken);
        if (!access.Succeeded) return new Response<CandidateCvSummary>(access.Message);

        var cvId = access.Data?.FirstOrDefault()?.CVUngVienId ?? 0;
        return cvId == 0
            ? new Response<CandidateCvSummary>("Ứng viên chưa có đơn thuộc doanh nghiệp.")
            : await GetCandidateCVAsync(cvId, cancellationToken);
    }

    [Description("Lấy danh sách đơn ứng tuyển thuộc các tin trong phạm vi doanh nghiệp hiện tại.")]
    public Task<Response<List<RecruitmentApplication>>> GetApplicationsAsync(
        [Description("Có thể lọc theo ID tin tuyển dụng.")] int? tinTuyenDungId = null,
        [Description("Số đơn trả về, từ 1 đến 50.")] int topN = 20,
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "get_applications", new { tinTuyenDungId, topN },
            () => GetApplicationsCoreAsync(tinTuyenDungId, topN, cancellationToken),
            cancellationToken);

    private async Task<Response<List<RecruitmentApplication>>> GetApplicationsCoreAsync(
        int? tinTuyenDungId, int topN,
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("donungtuyens", "list", cancellationToken);
        return await _sender.Send(
            new GetRecruiterApplicationsQuery
            {
                TinTuyenDungId = tinTuyenDungId,
                TopN = Math.Clamp(topN, 1, 50)
            },
            cancellationToken);
    }

    [Description("Lấy chi tiết một đơn ứng tuyển thuộc doanh nghiệp hiện tại.")]
    public Task<Response<RecruitmentApplication>> GetApplicationDetailAsync(
        [Description("ID đơn ứng tuyển cần xem.")] int donUngTuyenId,
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "get_application_detail", new { donUngTuyenId },
            () => GetApplicationDetailCoreAsync(donUngTuyenId, cancellationToken),
            cancellationToken);

    private async Task<Response<RecruitmentApplication>> GetApplicationDetailCoreAsync(
        int donUngTuyenId,
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("donungtuyens", "show", cancellationToken);
        var response = await _sender.Send(
            new GetRecruiterApplicationsQuery { DonUngTuyenId = donUngTuyenId, TopN = 1 },
            cancellationToken);
        if (!response.Succeeded) return new Response<RecruitmentApplication>(response.Message);

        var item = response.Data?.FirstOrDefault();
        return item == null
            ? new Response<RecruitmentApplication>("Không tìm thấy đơn ứng tuyển thuộc doanh nghiệp.")
            : new Response<RecruitmentApplication>(item);
    }

    [Description("Thống kê pipeline đơn ứng tuyển theo trạng thái trong phạm vi doanh nghiệp hiện tại.")]
    public Task<Response<List<ApplicationPipelineStage>>> GetApplicationPipelineAsync(
        [Description("Có thể lọc theo ID tin tuyển dụng.")] int? tinTuyenDungId = null,
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "get_application_pipeline", new { tinTuyenDungId },
            () => GetApplicationPipelineCoreAsync(tinTuyenDungId, cancellationToken),
            cancellationToken);

    private async Task<Response<List<ApplicationPipelineStage>>> GetApplicationPipelineCoreAsync(
        int? tinTuyenDungId,
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("donungtuyens", "list", cancellationToken);
        return await _sender.Send(
            new GetRecruiterApplicationPipelineQuery { TinTuyenDungId = tinTuyenDungId },
            cancellationToken);
    }

    [Description("Tìm đơn ứng tuyển đã chờ xử lý quá số ngày chỉ định trong phạm vi doanh nghiệp hiện tại.")]
    public Task<Response<List<RecruitmentApplication>>> FindStaleApplicationsAsync(
        [Description("Số ngày chưa xử lý tối thiểu, từ 1 đến 90. Mặc định 7.")] int days = 7,
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "find_stale_applications", new { days },
            () => FindStaleApplicationsCoreAsync(days, cancellationToken),
            cancellationToken);

    private async Task<Response<List<RecruitmentApplication>>> FindStaleApplicationsCoreAsync(
        int days,
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("donungtuyens", "list", cancellationToken);
        var cutoff = DateTime.UtcNow.AddDays(-Math.Clamp(days, 1, 90));
        return await _sender.Send(
            new GetRecruiterApplicationsQuery
            {
                TrangThai = TrangThaiDonUngTuyen.ChoXuLy,
                Before = cutoff,
                OldestFirst = true,
                TopN = 50
            },
            cancellationToken);
    }

    [Description("Lấy tổng quan tuyển dụng của doanh nghiệp. Chỉ người đại diện được dùng.")]
    public Task<Response<RecruitmentOverview>> GetRecruitmentOverviewAsync(CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "get_recruitment_overview", null,
            () => GetRecruitmentOverviewCoreAsync(cancellationToken),
            cancellationToken);

    private async Task<Response<RecruitmentOverview>> GetRecruitmentOverviewCoreAsync(
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("tintuyendungs", "list", cancellationToken);
        await _permissions.RequireAsync("donungtuyens", "list", cancellationToken);
        return await _sender.Send(new GetRecruiterOverviewQuery(), cancellationToken);
    }

    [Description("Lấy thống kê tuyển dụng toàn doanh nghiệp. Chỉ người đại diện được dùng.")]
    public Task<Response<CompanyRecruitmentStats>> GetCompanyRecruitmentStatsAsync(CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "get_company_recruitment_stats", null,
            () => GetCompanyRecruitmentStatsCoreAsync(cancellationToken),
            cancellationToken);

    private async Task<Response<CompanyRecruitmentStats>> GetCompanyRecruitmentStatsCoreAsync(
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("tintuyendungs", "list", cancellationToken);
        await _permissions.RequireAsync("donungtuyens", "list", cancellationToken);
        return await _sender.Send(new GetCompanyRecruitmentStatsQuery(), cancellationToken);
    }

    [Description("Lấy danh sách nhân sự và người đại diện thuộc doanh nghiệp hiện tại. Chỉ người đại diện được dùng.")]
    public Task<Response<List<CompanyMember>>> GetCompanyMembersAsync(CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "get_company_members", null,
            () => GetCompanyMembersCoreAsync(cancellationToken),
            cancellationToken);

    private async Task<Response<List<CompanyMember>>> GetCompanyMembersCoreAsync(
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("nhansus", "list", cancellationToken);
        return await _sender.Send(new GetCompanyMembersQuery(), cancellationToken);
    }

    [Description("Lấy hoạt động tuyển dụng tổng hợp của một nhân sự trong doanh nghiệp. Chỉ người đại diện được dùng.")]
    public Task<Response<RecruiterActivity>> GetRecruiterActivityAsync(
        [Description("ID người dùng nhân sự cần xem hoạt động.")] int nguoiDungId,
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "get_recruiter_activity", new { nguoiDungId },
            () => GetRecruiterActivityCoreAsync(nguoiDungId, cancellationToken),
            cancellationToken);

    private async Task<Response<RecruiterActivity>> GetRecruiterActivityCoreAsync(
        int nguoiDungId,
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("nhansus", "list", cancellationToken);
        await _permissions.RequireAsync("tintuyendungs", "list", cancellationToken);
        await _permissions.RequireAsync("donungtuyens", "list", cancellationToken);
        return await _sender.Send(
            new GetRecruiterActivityQuery { NguoiDungId = nguoiDungId },
            cancellationToken);
    }

}

public sealed class CurrentRecruitmentContext
{
    public string Route { get; set; } = string.Empty;
    public List<RecruitmentJobOption> DangTuyenJobs { get; set; } = new();
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


