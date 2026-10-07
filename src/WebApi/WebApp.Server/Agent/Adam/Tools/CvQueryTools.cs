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
using WebApp.Server.Agent.SharedState;

namespace WebApp.Server.Agent.Adam.Tools;

// Adapter giữa MAF tool calling và CQRS query. Nghiệp vụ vẫn nằm trong query handler.
internal sealed class CvQueryTools
{
    private readonly ISender _sender;
    private readonly ILogger<CvQueryTools> _logger;
    private readonly SharedStateStore _sharedState;
    private readonly IPermissionService _permissions;

    public CvQueryTools(
        ISender sender,
        ILogger<CvQueryTools> logger,
        SharedStateStore sharedState, IPermissionService permissions)
    {
        _sender = sender;
        _logger = logger;
        _sharedState = sharedState;
        _permissions = permissions;
    }

    [Description(
        "Lấy hồ sơ ứng viên - Profile của ứng viên đang đăng nhập hiện tại. " +
        "Gọi trước khi tư vấn hoặc tạo nội dung CV cần dữ liệu hồ sơ thật.")]
    public async Task<ProfileToolResult> GetMyProfileAsync(
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Adam tool get_my_profile đã bắt đầu.");
        await _permissions.RequireAsync("hosoungviens", "show", cancellationToken);
        try
        {
            var response = await _sender.Send(new GetMyHoSoUngVienQuery(), cancellationToken);
            if (!response.Succeeded || response.Data == null)
            {
                _logger.LogWarning("Adam tool get_my_profile không trả về hồ sơ nào. Succeeded={Succeeded}, Message={Message}", response.Succeeded, response.Message);
                return new ProfileToolResult
                {
                    Succeeded = false,
                    Message = response.Message ?? "Chưa có hồ sơ ứng viên.",
                    Profile = new GetAllHoSoUngViensViewModel()
                };
            }

            _logger.LogInformation("Adam tool get_my_profile hoàn tất. ProfileId={ProfileId}", response.Data.Id);
            return new ProfileToolResult
            {
                Succeeded = true,
                Message = "Đã lấy hồ sơ ứng viên hiện tại.",
                Profile = response.Data
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Adam tool get_my_profile thất bại.");
            return new ProfileToolResult
            {
                Succeeded = false,
                Message = "Không thể lấy hồ sơ ứng viên hiện tại.",
                Profile = new GetAllHoSoUngViensViewModel()
            };
        }
    }

    [Description(
        "Lấy chi tiết đầy đủ của một CV thuộc ứng viên đang đăng nhập hiện tại. " +
        "Dùng khi người dùng yêu cầu xem, phân tích hoặc chỉnh một CV đã tồn tại.")]
    public async Task<Response<CvDetailDto>> GetCvDetailAsync(
        [Description("ID của CV cần lấy chi tiết")] int cvId,
        CancellationToken cancellationToken = default)
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
    public async Task<Response<List<GetAllCVUngViensViewModel>>> GetMyCvsAsync(
        CancellationToken cancellationToken = default)
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
    public async Task<Response<List<SuggestedJobViewModel>>> SuggestJobsForMyCvAsync(
        [Description("ID CV cụ thể cần so khớp; bỏ trống để dùng CV mặc định")] int? cvId,
        CancellationToken cancellationToken = default)
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
        "Gợi ý mẫu CV phù hợp với hồ sơ của ứng viên (ưu tiên CV mặc định). " +
        "Trả về top mẫu kèm điểm phù hợp và lý do chọn (ngành, cấp bậc, ATS). " +
        "Dùng khi người dùng hỏi 'mẫu CV nào hợp với tôi', 'nên dùng theme nào'. " +
        "Áp dụng mẫu bằng frontend tool setCvTemplate, chỉ khi người dùng đồng ý.")]
    public async Task<Response<List<SuggestedCvThemeViewModel>>> SuggestCvThemeAsync(
        [Description("ID CV cụ thể cần gợi ý mẫu; bỏ trống để dùng CV mặc định")] int? cvId,
        [Description("Vị trí ứng tuyển muốn nhắm tới (vd: Backend Developer); bỏ trống để lấy từ hồ sơ")] string viTri,
        CancellationToken cancellationToken = default)
    {
        await _permissions.RequireAsync("cvthemes", "list", cancellationToken);
        return await _sender.Send(
            new GetSuggestedCvThemesQuery { CvUngVienId = cvId, ViTri = viTri, TopN = 3 },
            cancellationToken);
    }
}

public sealed class ProfileToolResult
{
    public bool Succeeded { get; set; }
    public string Message { get; set; } = string.Empty;
    public GetAllHoSoUngViensViewModel Profile { get; set; } = new();
}
