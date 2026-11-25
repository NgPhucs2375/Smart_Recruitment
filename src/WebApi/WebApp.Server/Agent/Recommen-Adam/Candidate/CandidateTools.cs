using System.ComponentModel;
using Application.DTOs.CV;
using Application.Interfaces;
using Application.Features.CVUngVien.Queries.GetAllCVUngViens;
using Application.Features.CVUngVien.Queries.GetCVUngVienById;
using Application.Features.DonUngTuyen.Commands.CreateDonUngTuyen;
using Application.Features.DonUngTuyen.Queries.GetAllDonUngTuyens;
using Application.Features.DonUngTuyen.Queries.GetDonUngTuyenById;
using Application.Features.HoSoUngVien.Queries.GetMyHoSoUngVien;
using Application.Features.KetQuaPhanTichCv.Queries.GetAllKetQuaPhanTichCvs;
using Application.Features.KetQuaPhuHop.Queries.GetCvJobMatch;
using Application.Features.KetQuaPhuHop.Queries.SuggestJobsForCv;
using Application.Features.TinTuyenDung.Queries.GetAllTinTuyenDungs;
using Application.Features.TinTuyenDung.Queries.GetTinTuyenDungById;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using WebApp.Server.Agent.Cache;
using WebApp.Server.Agent.Notifications;
using WebApp.Server.Agent.SharedState;

namespace WebApp.Server.Agent.RecommenAdam.Candidate;

internal sealed class CandidateTools
{
	private readonly ISender _sender;
	private readonly SharedStateStore _sharedState;
	private readonly IPermissionService _permissions;
	private readonly AgentToolCache _toolCache;
	private readonly IServiceScopeFactory _scopeFactory;
	private readonly IApplicationDbContext _context;
	private readonly ICurrentNguoiDungService _current;
	private readonly ILogger<CandidateTools> _logger;

	public CandidateTools(
		ISender sender,
		SharedStateStore sharedState,
		IPermissionService permissions,
		AgentToolCache toolCache,
		IServiceScopeFactory scopeFactory,
		IApplicationDbContext context,
		ICurrentNguoiDungService current,
		ILogger<CandidateTools> logger)
	{
		_sender = sender;
		_sharedState = sharedState;
		_permissions = permissions;
		_toolCache = toolCache;
		_scopeFactory = scopeFactory;
		_context = context;
		_current = current;
		_logger = logger;
    }

    [Description("Chỉ kiểm tra các trường thông tin cá nhân trong HoSoUngVien của ứng viên hiện tại. Không đọc, không phân tích và không kiểm tra CVUngVien. Dùng khi ứng viên hỏi: hồ sơ của tôi còn thiếu gì.")]
    public Task<Response<CandidateProfileCompleteness>> CheckProfileCompletenessAsync(CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "check_profile_completeness", null,
            () => CheckProfileCompletenessCoreAsync(cancellationToken),
            cancellationToken);

    private async Task<Response<CandidateProfileCompleteness>> CheckProfileCompletenessCoreAsync(
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("hosoungviens", "show", cancellationToken);
        var profile = await _sender.Send(new GetMyHoSoUngVienQuery(), cancellationToken);
        if (!profile.Succeeded || profile.Data == null)
            return new Response<CandidateProfileCompleteness>(profile.Message ?? "Không lấy được hồ sơ ứng viên.");

        var missing = new List<string>();
        if (string.IsNullOrWhiteSpace(profile.Data.HoTen)) missing.Add("Họ tên");
        if (string.IsNullOrWhiteSpace(profile.Data.SDT)) missing.Add("Số điện thoại");
        if (string.IsNullOrWhiteSpace(profile.Data.DiaChi)) missing.Add("Địa chỉ");
        if (string.IsNullOrWhiteSpace(profile.Data.ViTriUngTuyen)) missing.Add("Vị trí ứng tuyển");
        if (profile.Data.MucLuongMongMuon <= 0) missing.Add("Mức lương mong muốn");

        return new Response<CandidateProfileCompleteness>(new CandidateProfileCompleteness
        {
            HoSoUngVienId = profile.Data.Id,
            ThieuThongTin = missing,
            DaHoanThien = missing.Count == 0
        });
    }

    [Description("Phân tích CV của ứng viên, chỉ ra điểm mạnh, phần còn thiếu và gợi ý cải thiện dựa trên nội dung CV thực tế. Nếu không có cvId, dùng CV mặc định.")]
    public Task<Response<CandidateCvAnalysis>> AnalyzeCvAsync(
        [Description("ID CV cần phân tích, bỏ trống để dùng CV mặc định.")] int? cvId = null,
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "analyze_cv", new { cvId },
            () => AnalyzeCvCoreAsync(cvId, cancellationToken),
            cancellationToken);

    private async Task<Response<CandidateCvAnalysis>> AnalyzeCvCoreAsync(
        int? cvId,
        CancellationToken cancellationToken)
    {
        var cv = await GetCvAsync(cvId, cancellationToken);
        if (!cv.Succeeded || cv.Data == null) return new Response<CandidateCvAnalysis>(cv.Message ?? "Không lấy được CV.");

        var content = cv.Data.NoiDung;
        if (content == null)
            return new Response<CandidateCvAnalysis>("CV chưa có nội dung để phân tích.");

        // Ưu tiên kết quả agent đã chạy và lưu trên trang cv-phan-tich,
        // để chat và trang đọc chung một nguồn, không gọi LLM lần hai.
        await _permissions.RequireAsync("ketquaphantichcvs", "show", cancellationToken);
        var saved = await _sender.Send(new GetAllKetQuaPhanTichCvsQuery
        {
            CVUngVienId = cv.Data.Id,
            _start = 0,
            _end = 1,
        }, cancellationToken);
        var danhGia = saved.Data?.FirstOrDefault();
        if (danhGia?.DiemTongQuan is not null)
        {
            return new Response<CandidateCvAnalysis>(new CandidateCvAnalysis
            {
                CvUngVienId = cv.Data.Id,
                DiemManh = SplitLines(danhGia.DiemManh),
                CanCaiThien = SplitLines(danhGia.DiemYeu),
                DiemTongQuan = danhGia.DiemTongQuan,
                DiemPhuHop = danhGia.DiemPhuHop,
                NhanXet = danhGia.NhanXet,
                TinTuyenDungId = danhGia.TinTuyenDungId,
                GoiY = SplitLines(danhGia.GoiY).Select(FormatGoiY).ToList(),
                DanhGiaLuc = danhGia.DanhGiaLuc,
                DaDanhGiaBangAi = danhGia.DaDanhGiaBangAi,
            });
        }

        return new Response<CandidateCvAnalysis>(BuildCvAnalysis(cv.Data));
    }

    private static List<string> SplitLines(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? new List<string>()
            : value.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

    // GoiY lưu dạng "phan|viec"; chat đọc dạng dễ hiểu hơn.
    private static string FormatGoiY(string line)
    {
        var parts = line.Split('|', 2, StringSplitOptions.TrimEntries);
        return parts.Length == 2 ? $"{parts[0]}: {parts[1]}" : line;
    }

    [Description(
        "Xem CV mặc định hiện tại và đánh giá các điểm cần cải thiện trong cùng một lần gọi. " +
        "Dùng trực tiếp khi người dùng vừa muốn xem CV mặc định vừa hỏi cần cải thiện gì; " +
        "không gọi list_my_cvs, get_cv_detail hoặc analyze_cv thêm cho cùng yêu cầu.")]
    public Task<Response<CandidateCvReview>> ReviewDefaultCvAsync(
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "review_default_cv", null,
            () => ReviewDefaultCvCoreAsync(cancellationToken),
            cancellationToken);

    private async Task<Response<CandidateCvReview>> ReviewDefaultCvCoreAsync(
        CancellationToken cancellationToken)
    {
        var cv = await GetCvAsync(null, cancellationToken);
        if (!cv.Succeeded || cv.Data == null)
            return new Response<CandidateCvReview>(cv.Message ?? "Không lấy được CV mặc định.");

        return new Response<CandidateCvReview>(new CandidateCvReview
        {
            Cv = cv.Data,
            Analysis = BuildCvAnalysis(cv.Data)
        });
    }

    [Description("Tìm việc làm công khai theo từ khóa, địa điểm, lương hoặc hình thức làm việc. Chỉ trả tin đang tuyển. Kết quả được phân trang; khi người dùng yêu cầu xem thêm, tăng pageNumber và giữ nguyên các bộ lọc.")]
    public Task<PagedResponse<List<GetAllTinTuyenDungsViewModel>>> SearchJobsAsync(
        [Description("Từ khóa chức danh, kỹ năng hoặc doanh nghiệp.")] string? keyword = null,
        [Description("Địa điểm làm việc.")] string? location = null,
        [Description("Mức lương tối thiểu mong muốn.")] decimal? salaryMin = null,
        [Description("Mức lương tối đa mong muốn.")] decimal? salaryMax = null,
        [Description("Số kết quả, từ 1 đến 20.")] int topN = 10,
        [Description("Số trang, bắt đầu từ 1. Khi người dùng yêu cầu xem thêm, tăng số trang và giữ nguyên các bộ lọc.")] int pageNumber = 1,
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "search_jobs", new { keyword, location, salaryMin, salaryMax, topN, pageNumber },
            () => SearchJobsCoreAsync(keyword, location, salaryMin, salaryMax, topN, pageNumber, cancellationToken),
            cancellationToken);

    private async Task<PagedResponse<List<GetAllTinTuyenDungsViewModel>>> SearchJobsCoreAsync(
        string? keyword, string? location, decimal? salaryMin, decimal? salaryMax,
        int topN, int pageNumber,
        CancellationToken cancellationToken)
    {
        var pageSize = Math.Clamp(topN, 1, 20);
        await _permissions.RequireAsync("tintuyendungs", "list", cancellationToken);
        var page = Math.Clamp(pageNumber, 1, 1000);

        return await _sender.Send(new GetAllTinTuyenDungsQuery
        {
            _start = (page - 1) * pageSize,
            _end = page * pageSize,
            _filter = keyword,
            Location = location,
            SalaryMin = salaryMin,
            SalaryMax = salaryMax
        }, cancellationToken);
    }

    [Description("Đọc chi tiết JD của một tin tuyển dụng công khai theo id.")]
    public Task<Response<GetAllTinTuyenDungsViewModel>> GetJobDetailsAsync(
        [Description("ID tin tuyển dụng cần xem.")] int tinTuyenDungId,
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "get_job_details", new { tinTuyenDungId },
            () => GetJobDetailsCoreAsync(tinTuyenDungId, cancellationToken),
            cancellationToken);

    private async Task<Response<GetAllTinTuyenDungsViewModel>> GetJobDetailsCoreAsync(
        int tinTuyenDungId,
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("tintuyendungs", "show", cancellationToken);
        return await _sender.Send(new GetTinTuyenDungByIdQuery { Id = tinTuyenDungId }, cancellationToken);
    }

    [Description("Lấy các việc làm phù hợp với CV mặc định hoặc CV được chọn, kèm điểm match. Kết quả được phân trang sau khi xếp hạng; khi người dùng yêu cầu xem thêm, tăng pageNumber và giữ nguyên cvId.")]
    public Task<Response<List<SuggestedJobViewModel>>> GetJobRecommendationsAsync(
        [Description("ID CV cần so khớp, bỏ trống để dùng CV mặc định.")] int? cvId = null,
        [Description("Số trang, bắt đầu từ 1. Khi người dùng yêu cầu xem thêm, tăng số trang.")] int pageNumber = 1,
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "get_job_recommendations", new { cvId, pageNumber },
            () => GetJobRecommendationsCoreAsync(cvId, pageNumber, cancellationToken),
            cancellationToken);

    private async Task<Response<List<SuggestedJobViewModel>>> GetJobRecommendationsCoreAsync(
        int? cvId, int pageNumber,
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("ketquaphuhops", "list", cancellationToken);
        var response = await _sender.Send(new GetSuggestedJobsForCvQuery
        {
            CvUngVienId = cvId,
            TopN = 10,
            PageNumber = Math.Clamp(pageNumber, 1, 1000),
            PageSize = 10,
            MinimumScore = 0.50f,
        }, cancellationToken);
        if (response.Succeeded && response.Data is not null)
        {
            _sharedState.Set("jobRecommendations", response.Data);
            _sharedState.Set("lastAction", "jobRecommendationsLoaded");
        }

        return response;
    }

    [Description(
        "Chấm mức phù hợp giữa một CV và một tin tuyển dụng bằng scorer tất định: " +
        "điểm 0..1, kỹ năng khớp, kỹ năng còn thiếu, kỹ năng bắt buộc còn thiếu. " +
        "Gọi trước khi đánh giá CV theo một tin cụ thể; không tự suy ra điểm.")]
    public Task<Response<CvJobMatchViewModel>> GetMatchBreakdownAsync(
        [Description("ID CV của ứng viên đang đăng nhập.")] int cvId,
        [Description("ID tin tuyển dụng cần so khớp.")] int tinTuyenDungId,
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "get_cv_job_match", new { cvId, tinTuyenDungId },
            () => GetMatchBreakdownCoreAsync(cvId, tinTuyenDungId, cancellationToken),
            cancellationToken);

    private async Task<Response<CvJobMatchViewModel>> GetMatchBreakdownCoreAsync(
        int cvId, int tinTuyenDungId,
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("ketquaphuhops", "show", cancellationToken);
        try
        {
            return await _sender.Send(new GetCvJobMatchQuery(cvId, tinTuyenDungId), cancellationToken);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception)
        {
            return new Response<CvJobMatchViewModel>("Không chấm được mức phù hợp CV với tin.");
        }
    }

    [Description(
        "Giải thích mức phù hợp giữa một tin tuyển dụng và CV bằng scorer tất định: điểm 0..1, kỹ năng khớp, " +
        "kỹ năng còn thiếu, kỹ năng bắt buộc còn thiếu. Dùng được cho mọi tin đang tuyển, không chỉ tin nằm trong danh sách gợi ý.")]
    public Task<Response<CvJobMatchViewModel>> ExplainJobMatchAsync(
        [Description("ID tin tuyển dụng cần giải thích mức độ phù hợp.")] int tinTuyenDungId,
        [Description("ID CV cần so khớp, bỏ trống để dùng CV mặc định.")] int? cvId = null,
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "explain_job_match", new { tinTuyenDungId, cvId },
            () => ExplainJobMatchCoreAsync(tinTuyenDungId, cvId, cancellationToken),
            cancellationToken);

    private async Task<Response<CvJobMatchViewModel>> ExplainJobMatchCoreAsync(
        int tinTuyenDungId, int? cvId,
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("ketquaphuhops", "show", cancellationToken);
        try
        {
            return await _sender.Send(new GetCvJobMatchQuery(cvId, tinTuyenDungId), cancellationToken);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception)
        {
            return new Response<CvJobMatchViewModel>("Không chấm được mức phù hợp CV với tin.");
        }
    }

    [Description("So sánh 2-3 tin tuyển dụng công khai theo JD, lương, địa điểm, kỹ năng kèm điểm phù hợp với CV.")]
    public async Task<Response<CompareJobsResult>> CompareJobsAsync(
        [Description("Danh sách 2 đến 3 ID tin tuyển dụng cần so sánh.")] List<int> tinTuyenDungIds,
        [Description("ID CV cần so khớp, bỏ trống để dùng CV mặc định.")] int? cvId = null,
        CancellationToken cancellationToken = default)
    {
        var ids = tinTuyenDungIds.Distinct().Take(3).ToList();
        if (ids.Count < 2) return new Response<CompareJobsResult>("Hãy cung cấp ít nhất hai tin tuyển dụng để so sánh.");

        var results = await Task.WhenAll(ids.Select(id => GetJobDetailsInNewScopeAsync(id, cancellationToken)));
        var jobs = results
            .Where(result => result.Succeeded && result.Data != null)
            .Select(result => result.Data!)
            .ToList();

        var matches = new List<CvJobMatchViewModel>();
        foreach (var id in ids)
        {
            var match = await ExplainJobMatchAsync(id, cvId, cancellationToken);
            if (match.Succeeded && match.Data != null) matches.Add(match.Data);
        }

        return new Response<CompareJobsResult>(new CompareJobsResult { Jobs = jobs, Matches = matches });
    }

    private async Task<Response<GetAllTinTuyenDungsViewModel>> GetJobDetailsInNewScopeAsync(
        int tinTuyenDungId,
        CancellationToken cancellationToken)
    {
        // Mỗi job chạy trong scope riêng vì ApplicationDbContext là scoped và
        // không thread-safe khi các query song song dùng chung một instance.
        await using var scope = _scopeFactory.CreateAsyncScope();
        return await scope.ServiceProvider
            .GetRequiredService<CandidateTools>()
            .GetJobDetailsAsync(tinTuyenDungId, cancellationToken);
    }

    [Description("Xem các đơn ứng tuyển của ứng viên hiện tại.")]
    public Task<PagedResponse<List<GetAllDonUngTuyensViewModel>>> GetMyApplicationsAsync(
        [Description("Số lượng đơn muốn lấy, từ 1 đến 50.")] int topN = 20,
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "get_my_applications", new { topN },
            () => GetMyApplicationsCoreAsync(topN, cancellationToken),
            cancellationToken);

    private async Task<PagedResponse<List<GetAllDonUngTuyensViewModel>>> GetMyApplicationsCoreAsync(
        int topN,
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("donungtuyens", "list", cancellationToken);
        return await _sender.Send(new GetAllDonUngTuyensQuery { _start = 0, _end = Math.Clamp(topN, 1, 50) }, cancellationToken);
    }

    [Description("Theo dõi trạng thái và chi tiết của một đơn ứng tuyển thuộc ứng viên hiện tại.")]
    public Task<Response<GetAllDonUngTuyensViewModel>> GetApplicationStatusAsync(
        [Description("ID đơn ứng tuyển cần xem.")] int donUngTuyenId,
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "get_application_status", new { donUngTuyenId },
            () => GetApplicationStatusCoreAsync(donUngTuyenId, cancellationToken),
            cancellationToken);

    private async Task<Response<GetAllDonUngTuyensViewModel>> GetApplicationStatusCoreAsync(
        int donUngTuyenId,
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("donungtuyens", "show", cancellationToken);
        return await _sender.Send(new GetDonUngTuyenByIdQuery { Id = donUngTuyenId }, cancellationToken);
    }

    [Description(
        "NỘP ĐƠN THẬT: tạo đơn ứng tuyển của ứng viên hiện tại vào một tin tuyển dụng và ghi DB. " +
        "Chỉ gọi khi người dùng nói rõ muốn nộp tin đó và đã chốt CV. " +
        "Server tự kiểm tra quyền, CV thuộc ứng viên, CV sẵn sàng, tin còn nhận hồ sơ và chống nộp trùng; " +
        "lỗi nghiệp vụ trả message tiếng Việt để báo nguyên văn.")]
    public async Task<Response<CandidateApplyResult>> ApplyToJobAsync(
        [Description("ID tin tuyển dụng muốn nộp.")] int tinTuyenDungId,
        [Description("ID CV sẽ nộp, do người dùng chọn hoặc xác nhận; không tự đoán.")] int cvId,
        CancellationToken cancellationToken = default)
    {
        await _permissions.RequireAsync("donungtuyens", "create", cancellationToken);

        var created = await _sender.Send(new CreateDonUngTuyenCommand
        {
            TinTuyenDungId = tinTuyenDungId,
            CVUngVienId = cvId,
        }, cancellationToken);

        if (!created.Succeeded || created.Data <= 0)
            return new Response<CandidateApplyResult>(created.Message ?? "Nộp đơn không thành công.");

        var don = await _context.DonUngTuyens.AsNoTracking()
            .Where(d => d.Id == created.Data)
            .Select(d => new
            {
                d.Id,
                d.TinTuyenDungId,
                d.TinTuyenDung.TieuDe,
                d.TinTuyenDung.DoanhNghiep.TenDoanhNghiep,
                d.CVUngVienId,
                TenCv = d.CVUngVien.TenFile,
                d.TrangThai,
                d.NgayUngTuyen,
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (don == null)
            return new Response<CandidateApplyResult>(
                $"Đã tạo đơn #{created.Data} nhưng chưa đọc lại được. Kiểm tra tại Việc đã ứng tuyển.");

        _logger.LogInformation(
            "Đơn ứng tuyển tạo qua Adam tool: tinTuyenDungId={TinTuyenDungId}, cvUngVienId={CvUngVienId}, donUngTuyenId={DonUngTuyenId}",
            don.TinTuyenDungId, don.CVUngVienId, don.Id);

        return new Response<CandidateApplyResult>(new CandidateApplyResult
        {
            DonUngTuyenId = don.Id,
            TinTuyenDungId = don.TinTuyenDungId,
            TieuDe = don.TieuDe ?? "",
            TenDoanhNghiep = don.TenDoanhNghiep ?? "",
            CVUngVienId = don.CVUngVienId,
            TenCv = don.TenCv ?? "",
            TrangThai = don.TrangThai.ToString(),
            NgayUngTuyen = don.NgayUngTuyen,
        }, created.Message ?? "Đã nộp hồ sơ.");
    }

    [Description(
        "Xem thông báo của ứng viên đang đăng nhập: việc làm mới, lịch phỏng vấn, cập nhật đơn ứng tuyển. " +
        "Chỉ đọc; không đánh dấu đã đọc và không tạo thông báo mới.")]
    public async Task<Response<AgentNotificationsResult>> GetMyNotificationsAsync(
        [Description("Chỉ lấy thông báo chưa đọc. Bỏ trống để xem cả thông báo đã đọc.")] bool unreadOnly = false,
        [Description("Số thông báo muốn lấy, từ 1 đến 50.")] int limit = 10,
        CancellationToken cancellationToken = default)
    {
        // Không dùng AgentToolCache: trạng thái đã đọc thay đổi liên tục,
        // cache 120 giây sẽ trả UnreadCount sai ngay sau khi người dùng đọc thông báo.
        var current = await _current.ResolveAsync();
        var take = Math.Clamp(limit, 1, 50);

        var query = _context.NotificationRecipients
            .AsNoTracking()
            .Where(r => r.NguoiDungId == current.Id);

        var unreadCount = await _context.NotificationRecipients
            .AsNoTracking()
            .CountAsync(r => r.NguoiDungId == current.Id && !r.IsRead, cancellationToken);

        if (unreadOnly) query = query.Where(r => !r.IsRead);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(r => r.Notification.Created)
            .Take(take)
            .Select(r => new AgentNotificationItem
            {
                Id = r.NotificationId,
                TieuDe = r.Notification.TieuDe,
                NoiDung = r.Notification.NoiDung,
                Loai = r.Notification.LoaiThongBao == LoaiThongBao.LichPhongVan ? "Lịch phỏng vấn"
                    : r.Notification.LoaiThongBao == LoaiThongBao.DonUngTuyen ? "Đơn ứng tuyển"
                    : r.Notification.LoaiThongBao == LoaiThongBao.ViecLamMoi ? "Việc làm mới"
                    : r.Notification.LoaiThongBao == LoaiThongBao.CVUngVien ? "CV ứng viên"
                    : "Lời mời nhân sự",
                DaDoc = r.IsRead,
                TaoLuc = r.Notification.Created,
                ReferenceType = r.Notification.ReferenceType,
                ReferenceId = r.Notification.ReferenceId,
                TinTuyenDungId = r.Notification.ReferenceType == "DonUngTuyen"
                    ? _context.DonUngTuyens.Where(d => d.Id == r.Notification.ReferenceId)
                        .Select(d => (int?)d.TinTuyenDungId).FirstOrDefault()
                    : null,
            })
            .ToListAsync(cancellationToken);

        return new Response<AgentNotificationsResult>(new AgentNotificationsResult
        {
            UnreadCount = unreadCount,
            TotalCount = totalCount,
            UnreadOnly = unreadOnly,
            Items = items,
        });
    }

    [Description(
        "Lịch sử trạng thái của một đơn ứng tuyển thuộc ứng viên hiện tại: từng lần chuyển trạng thái, " +
        "thời điểm, tác nhân (người hoặc hệ thống) và ghi chú. Dùng khi người dùng hỏi đơn đã đi qua những bước nào.")]
    public Task<Response<ApplicationTimelineResult>> GetApplicationTimelineAsync(
        [Description("ID đơn ứng tuyển cần xem lịch sử.")] int donUngTuyenId,
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "get_application_timeline", new { donUngTuyenId },
            () => GetApplicationTimelineCoreAsync(donUngTuyenId, cancellationToken),
            cancellationToken);

    private async Task<Response<ApplicationTimelineResult>> GetApplicationTimelineCoreAsync(
        int donUngTuyenId,
        CancellationToken cancellationToken)
    {
        // Đi qua query chi tiết để dùng chung kiểm tra quyền + phạm vi chủ sở hữu.
        var don = await GetApplicationStatusCoreAsync(donUngTuyenId, cancellationToken);
        if (!don.Succeeded || don.Data == null)
            return new Response<ApplicationTimelineResult>(don.Message ?? "Không tìm thấy đơn ứng tuyển.");

        var rows = await _context.LichSuTrangThaiDonUngTuyens
            .AsNoTracking()
            .Where(x => x.DonUngTuyenId == donUngTuyenId)
            .OrderBy(x => x.Created)
            .Select(x => new
            {
                x.TrangThaiTruoc,
                x.TrangThaiSau,
                x.Trigger,
                x.NguoiThucHienId,
                x.GhiChu,
                x.Created,
            })
            .ToListAsync(cancellationToken);

        return new Response<ApplicationTimelineResult>(new ApplicationTimelineResult
        {
            DonUngTuyenId = donUngTuyenId,
            TrangThaiHienTai = don.Data.TrangThai.ToString(),
            Entries = rows.Select(x => new ApplicationTimelineEntry
            {
                TrangThaiTruoc = x.TrangThaiTruoc.ToString(),
                TrangThaiSau = x.TrangThaiSau.ToString(),
                Trigger = x.Trigger?.ToString(),
                NguoiThucHienId = x.NguoiThucHienId,
                GhiChu = x.GhiChu,
                ThoiDiem = x.Created,
            }).ToList(),
        });
    }

    private async Task<Response<CvDetailDto>> GetCvAsync(int? cvId, CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("cvungviens", "show", cancellationToken);
        if (cvId.HasValue) return await _sender.Send(new GetCVUngVienByIdQuery { Id = cvId.Value }, cancellationToken);
        await _permissions.RequireAsync("cvungviens", "list", cancellationToken);
        var cvs = await _sender.Send(new GetAllCVUngViensQuery { _start = 0, _end = 20 }, cancellationToken);
        var defaultCv = cvs.Data?.FirstOrDefault(x => x.IsDefault);
        return defaultCv == null
            ? new Response<CvDetailDto>("Không tìm thấy CV mặc định.")
            : await _sender.Send(new GetCVUngVienByIdQuery { Id = defaultCv.Id }, cancellationToken);
    }

    private static CandidateCvAnalysis BuildCvAnalysis(CvDetailDto cv)
    {
        var content = cv.NoiDung;
        var strengths = new List<string>();
        var improvements = new List<string>();
        if (content.KyNang.Count > 0) strengths.Add($"Có {content.KyNang.Count} kỹ năng trong CV"); else improvements.Add("Bổ sung kỹ năng chuyên môn");
        if (content.KinhNghiemLamViec.Count > 0) strengths.Add("Có kinh nghiệm làm việc"); else improvements.Add("Bổ sung kinh nghiệm hoặc dự án tiêu biểu");
        if (content.DuAn.Count > 0) strengths.Add("Có dự án thể hiện năng lực"); else improvements.Add("Bổ sung dự án hoặc sản phẩm đã thực hiện");
        if (content.HocVan.Count == 0) improvements.Add("Bổ sung học vấn");
        if (string.IsNullOrWhiteSpace(content.ThongTinLienHe?.Email)) improvements.Add("Bổ sung email liên hệ");
        if (string.IsNullOrWhiteSpace(content.ThongTinLienHe?.ViTriUngTuyen)) improvements.Add("Nêu rõ vị trí ứng tuyển mục tiêu");

        return new CandidateCvAnalysis
        {
            CvUngVienId = cv.Id,
            DiemManh = strengths,
            CanCaiThien = improvements
        };
    }
}

public sealed class CandidateProfileCompleteness
{
    public int HoSoUngVienId { get; set; }
    public bool DaHoanThien { get; set; }
    public List<string> ThieuThongTin { get; set; } = new();
}

public sealed class CandidateApplyResult
{
    public int DonUngTuyenId { get; set; }
    public int TinTuyenDungId { get; set; }
    public string TieuDe { get; set; } = "";
    public string TenDoanhNghiep { get; set; } = "";
    public int CVUngVienId { get; set; }
    public string TenCv { get; set; } = "";
    public string TrangThai { get; set; } = "";
    public DateTime? NgayUngTuyen { get; set; }
}

public sealed class CandidateCvAnalysis
{
    public int CvUngVienId { get; set; }
    public List<string> DiemManh { get; set; } = new();
    public List<string> CanCaiThien { get; set; } = new();

    // Kết quả agent đã lưu (null khi chưa chạy đánh giá).
    public int? DiemTongQuan { get; set; }
    public float? DiemPhuHop { get; set; }
    public string? NhanXet { get; set; }
    public int? TinTuyenDungId { get; set; }
    public List<string> GoiY { get; set; } = new();
    public DateTime? DanhGiaLuc { get; set; }
    public bool DaDanhGiaBangAi { get; set; }
}

public sealed class CandidateCvReview
{
    public CvDetailDto Cv { get; set; } = new();
    public CandidateCvAnalysis Analysis { get; set; } = new();
}

public sealed class CompareJobsResult
{
    public List<GetAllTinTuyenDungsViewModel> Jobs { get; set; } = new();
    public List<CvJobMatchViewModel> Matches { get; set; } = new();
}

public sealed class ApplicationTimelineResult
{
    public int DonUngTuyenId { get; set; }
    public string TrangThaiHienTai { get; set; } = "";
    public List<ApplicationTimelineEntry> Entries { get; set; } = new();
}

public sealed class ApplicationTimelineEntry
{
    public string TrangThaiTruoc { get; set; } = "";
    public string TrangThaiSau { get; set; } = "";
    public string? Trigger { get; set; }
    public int? NguoiThucHienId { get; set; }
    public string? GhiChu { get; set; }
    public DateTime ThoiDiem { get; set; }
}
