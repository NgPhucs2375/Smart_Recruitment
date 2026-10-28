using System.ComponentModel;
using Application.DTOs.CV;
using Application.Interfaces;
using Application.Features.CVUngVien.Queries.GetAllCVUngViens;
using Application.Features.CVUngVien.Queries.GetCVUngVienById;
using Application.Features.CvTheme.Queries.SuggestCvThemes;
using Application.Features.HoSoUngVien.Queries.GetAllHoSoUngViens;
using Application.Features.HoSoUngVien.Queries.GetMyHoSoUngVien;
using Application.Features.KetQuaPhuHop.Queries.SuggestJobsForCv;
using Application.Wrappers;
using MediatR;
using Microsoft.Extensions.Logging;
using WebApp.Server.Agent.Cache;
using WebApp.Server.Agent.SharedState;

namespace WebApp.Server.Agent.Adam.Tools;

// Adapter giữa MAF tool calling và CQRS query. Nghiệp vụ vẫn nằm trong query handler.
internal sealed class CvQueryTools
{
    private readonly ISender _sender;
    private readonly ILogger<CvQueryTools> _logger;
    private readonly SharedStateStore _sharedState;
    private readonly IPermissionService _permissions;
    private readonly AgentToolCache _toolCache;

    public CvQueryTools(
        ISender sender,
        ILogger<CvQueryTools> logger,
        SharedStateStore sharedState, IPermissionService permissions,
        AgentToolCache toolCache)
    {
        _sender = sender;
        _logger = logger;
        _sharedState = sharedState;
        _permissions = permissions;
        _toolCache = toolCache;
    }

    [Description(
        "Lấy hồ sơ ứng viên - Profile của ứng viên đang đăng nhập hiện tại. " +
        "Gọi trước khi tư vấn hoặc tạo nội dung CV cần dữ liệu hồ sơ thật.")]
    public Task<Response<GetAllHoSoUngViensViewModel>> GetMyProfileAsync(
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "get_my_profile", null,
            () => GetMyProfileCoreAsync(cancellationToken),
            cancellationToken);

    private async Task<Response<GetAllHoSoUngViensViewModel>> GetMyProfileCoreAsync(
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Adam tool get_my_profile đã bắt đầu.");
        await _permissions.RequireAsync("hosoungviens", "show", cancellationToken);
        try
        {
            var response = await _sender.Send(new GetMyHoSoUngVienQuery(), cancellationToken);
            if (!response.Succeeded || response.Data == null)
            {
                _logger.LogWarning("Adam tool get_my_profile không trả về hồ sơ nào. Succeeded={Succeeded}, Message={Message}", response.Succeeded, response.Message);
                return new Response<GetAllHoSoUngViensViewModel>(response.Message ?? "Chưa có hồ sơ ứng viên.");
            }

            _logger.LogInformation("Adam tool get_my_profile hoàn tất. ProfileId={ProfileId}", response.Data.Id);
            return response;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Adam tool get_my_profile thất bại.");
            return new Response<GetAllHoSoUngViensViewModel>("Không thể lấy hồ sơ ứng viên hiện tại.");
        }
    }

    [Description(
        "Lấy chi tiết đầy đủ của một CV thuộc ứng viên đang đăng nhập hiện tại. " +
        "Dùng khi người dùng yêu cầu xem, phân tích hoặc chỉnh một CV đã tồn tại.")]
    public Task<Response<CvDetailDto>> GetCvDetailAsync(
        [Description("ID của CV cần lấy chi tiết")] int cvId,
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "get_cv_detail", new { cvId },
            () => GetCvDetailCoreAsync(cvId, cancellationToken),
            cancellationToken);

    private async Task<Response<CvDetailDto>> GetCvDetailCoreAsync(
        int cvId,
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("cvungviens", "show", cancellationToken);
        return await _sender.Send(
            new GetCVUngVienByIdQuery { Id = cvId },
            cancellationToken);
    }

    [Description(
        "Lấy danh sách CV đã lưu của ứng viên đang đăng nhập (mới nhất trước), " +
        "kèm id, tên file, vị trí ứng tuyển, template và CV mặc định. " +
        "Gọi tool này trước khi mở/chỉnh một CV đã lưu để biết cvId.")]
    public Task<Response<List<GetAllCVUngViensViewModel>>> GetMyCvsAsync(
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "list_my_cvs", null,
            () => GetMyCvsCoreAsync(cancellationToken),
            cancellationToken);

    private async Task<Response<List<GetAllCVUngViensViewModel>>> GetMyCvsCoreAsync(
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("cvungviens", "list", cancellationToken);
        var response = await _sender.Send(
            new GetAllCVUngViensQuery { _start = 0, _end = 20 },
            cancellationToken);

        if (response.Succeeded && response.Data is not null)
        {
            _sharedState.Set("myCvs", response.Data);
            _sharedState.Set("lastAction", "myCvsLoaded");
        }

        return response;
    }

    [Description(
        "Gợi ý các tin tuyển dụng đang tuyển phù hợp với CV của ứng viên (ưu tiên CV mặc định). " +
        "Trả về top tin kèm điểm phù hợp, kỹ năng đã khớp và kỹ năng còn thiếu. " +
        "Dùng khi người dùng hỏi 'gợi ý việc làm', 'tôi phù hợp với công việc nào'.")]
    public Task<Response<List<SuggestedJobViewModel>>> SuggestJobsForMyCvAsync(
        [Description("ID CV cụ thể cần so khớp; bỏ trống để dùng CV mặc định")] int? cvId,
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "suggest_jobs_for_my_cv", new { cvId },
            () => SuggestJobsForMyCvCoreAsync(cvId, cancellationToken),
            cancellationToken);

    private async Task<Response<List<SuggestedJobViewModel>>> SuggestJobsForMyCvCoreAsync(
        int? cvId,
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("ketquaphuhops", "list", cancellationToken);
        var response = await _sender.Send(
            new GetSuggestedJobsForCvQuery { CvUngVienId = cvId, TopN = 10 },
            cancellationToken);

        if (response.Succeeded && response.Data is not null)
        {
            _sharedState.Set("jobRecommendations", response.Data);
            _sharedState.Set("lastAction", "jobRecommendationsLoaded");
        }

        return response;
    }

    [Description(
        "Gợi ý tối đa 3 mẫu CV đang bật và render được theo ngành/vị trí/cấp độ công việc/phong cách/ATS. " +
        "Dùng ngoài editor; trong editor dùng suggestCvThemeForDraft để lấy nội dung chưa lưu. " +
        "Ngoài editor bỏ trống cvId để dùng CV đã lưu của user — kết quả lúc đó dựa trên CV đã lưu, nêu rõ điều này. " +
        "Chuyển tiêu chí người dùng nói rõ thành tham số; tham số trống thì backend tự suy từ vị trí/kỹ năng CV " +
        "(được phép suy từ dữ liệu CV có sẵn, ghi rõ là suy đoán khi trình bày); không đoán cấp độ từ số mục kinh nghiệm. " +
        "Luôn gọi tool trước khi hỏi bổ sung thông tin; kết quả kèm cảnh báo thiếu dữ liệu thì trình bày ngay với caveat, " +
        "không bắt user cung cấp trước. Kết quả có lý do, cảnh báo; không tự lưu hoặc đổi nội dung CV.")]
    public Task<Response<List<SuggestedCvThemeViewModel>>> SuggestCvThemeAsync(
        [Description("CV thuộc chính người dùng; bỏ trống để dùng CV mặc định của họ")] int? cvId = null,
        [Description("Vị trí công việc mục tiêu, ví dụ Backend Developer")] string? viTri = null,
        [Description("Ngành công việc mục tiêu, ví dụ IT, Data, Marketing, tài chính, giáo dục")] string? nganh = null,
        [Description("Cấp độ công việc mục tiêu: intern/fresher/junior/mid/senior/lead/manager; không phải sửa cấp độ thực của người dùng")] string? capBac = null,
        [Description("Phong cách mong muốn: tối giản, chuyên nghiệp, hiện đại, sáng tạo hoặc editorial")] string? phongCach = null,
        [Description("Bố cục bắt buộc: 1 hoặc 2 cột; null nếu không yêu cầu")] int? soCot = null,
        [Description("Ưu tiên metadata thân thiện ATS")] bool uuTienATS = true,
        [Description("Chỉ lấy mẫu có nhãn ATS khi user nói bắt buộc/chỉ ATS")] bool batBuocATS = false,
        [Description("Tối đa 3 phần cần nhấn mạnh: projects/experience/skills/education")] string[]? nhanManh = null,
        CancellationToken cancellationToken = default)
        => _toolCache.GetOrCreateAsync(
            "suggest_cv_theme", new { cvId, viTri, nganh, capBac, phongCach, soCot, uuTienATS, batBuocATS, nhanManh },
            () => SuggestCvThemeCoreAsync(cvId, viTri, nganh, capBac, phongCach, soCot, uuTienATS, batBuocATS, nhanManh, cancellationToken),
            cancellationToken);

    private async Task<Response<List<SuggestedCvThemeViewModel>>> SuggestCvThemeCoreAsync(
        int? cvId, string? viTri, string? nganh, string? capBac, string? phongCach,
        int? soCot, bool uuTienATS, bool batBuocATS, string[]? nhanManh,
        CancellationToken cancellationToken)
    {
        await _permissions.RequireAsync("cvthemes", "list", cancellationToken);
        var result = await _sender.Send(
            new GetSuggestedCvThemesQuery { CvUngVienId = cvId, ViTri = viTri, Nganh = nganh, CapBac = capBac,
                PhongCach = phongCach, SoCot = soCot, UuTienATS = uuTienATS, BatBuocATS = batBuocATS, NhanManh = nhanManh, TopN = 3 },
            cancellationToken);
        _sharedState.Set("cvThemeRecommendations", result.Data ?? []);
        return result;
    }
}

 
