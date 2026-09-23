using System.ComponentModel;
using Application.DTOs.CV;
using Application.Features.CVUngVien.Queries.GetAllCVUngViens;
using Application.Features.CVUngVien.Queries.GetCVUngVienById;
using Application.Features.HoSoUngVien.Queries.GetAllHoSoUngViens;
using Application.Features.HoSoUngVien.Queries.GetMyHoSoUngVien;
using Application.Features.KetQuaPhuHop.Queries.SuggestJobsForCv;
using Application.Wrappers;
using MediatR;
using Microsoft.Extensions.Logging;

namespace WebApp.Server.Agent.Adam.Tools;

// Adapter giữa MAF tool calling và CQRS query. Nghiệp vụ vẫn nằm trong query handler.
internal sealed class CvQueryTools
{
    private readonly ISender _sender;
    private readonly ILogger<CvQueryTools> _logger;

    public CvQueryTools(ISender sender, ILogger<CvQueryTools> logger)
    {
        _sender = sender;
        _logger = logger;
    }

    [Description(
        "Lấy hồ sơ ứng viên - Profile của ứng viên đang đăng nhập hiện tại. " +
        "Gọi trước khi tư vấn hoặc tạo nội dung CV cần dữ liệu hồ sơ thật.")]
    public async Task<ProfileToolResult> GetMyProfileAsync(
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Adam tool get_my_profile started.");
        try
        {
            var response = await _sender.Send(new GetMyHoSoUngVienQuery(), cancellationToken);
            if (!response.Succeeded || response.Data == null)
            {
                _logger.LogWarning("Adam tool get_my_profile returned no profile. Succeeded={Succeeded}, Message={Message}", response.Succeeded, response.Message);
                return new ProfileToolResult
                {
                    Succeeded = false,
                    Message = response.Message ?? "Chưa có hồ sơ ứng viên.",
                    Profile = new GetAllHoSoUngViensViewModel()
                };
            }

            _logger.LogInformation("Adam tool get_my_profile completed successfully. ProfileId={ProfileId}", response.Data.Id);
            return new ProfileToolResult
            {
                Succeeded = true,
                Message = "Đã lấy hồ sơ ứng viên hiện tại.",
                Profile = response.Data
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Adam tool get_my_profile failed.");
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
    public Task<Response<CvDetailDto>> GetCvDetailAsync(
        [Description("ID của CV cần lấy chi tiết")] int cvId,
        CancellationToken cancellationToken = default)
    {
        return _sender.Send(
            new GetCVUngVienByIdQuery { Id = cvId },
            cancellationToken);
    }

    [Description(
        "Lấy danh sách CV đã lưu của ứng viên đang đăng nhập (mới nhất trước), " +
        "kèm id, tên file, vị trí ứng tuyển, template và CV mặc định. " +
        "Gọi tool này trước khi mở/chỉnh một CV đã lưu để biết cvId.")]
    public Task<Response<List<GetAllCVUngViensViewModel>>> GetMyCvsAsync(
        CancellationToken cancellationToken = default)
    {
        return _sender.Send(
            new GetAllCVUngViensQuery { _start = 0, _end = 20 },
            cancellationToken);
    }

    [Description(
        "Gợi ý các tin tuyển dụng đang tuyển phù hợp với CV của ứng viên (ưu tiên CV mặc định). " +
        "Trả về top tin kèm điểm phù hợp, kỹ năng đã khớp và kỹ năng còn thiếu. " +
        "Dùng khi người dùng hỏi 'gợi ý việc làm', 'tôi phù hợp với công việc nào'.")]
    public Task<Response<List<SuggestedJobViewModel>>> SuggestJobsForMyCvAsync(
        [Description("ID CV cụ thể cần so khớp; bỏ trống để dùng CV mặc định")] int? cvId,
        CancellationToken cancellationToken = default)
    {
        return _sender.Send(
            new GetSuggestedJobsForCvQuery { CvUngVienId = cvId, TopN = 10 },
            cancellationToken);
    }
}

public sealed class ProfileToolResult
{
    public bool Succeeded { get; set; }
    public string Message { get; set; } = string.Empty;
    public GetAllHoSoUngViensViewModel Profile { get; set; } = new();
}
