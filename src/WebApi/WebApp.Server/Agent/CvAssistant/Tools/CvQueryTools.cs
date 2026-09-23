using System.ComponentModel;
using Application.DTOs.CV;
using Application.Features.CVUngVien.Queries.GetAllCVUngViens;
using Application.Features.CVUngVien.Queries.GetCVUngVienById;
using Application.Features.HoSoUngVien.Queries.GetAllHoSoUngViens;
using Application.Features.HoSoUngVien.Queries.GetMyHoSoUngVien;
using Application.Features.CvTheme.Queries.SuggestCvThemes;
using Application.Features.KetQuaPhuHop.Queries.SuggestJobsForCv;
using Application.Wrappers;
using MediatR;

namespace WebApp.Server.Agent.CvAssistant.Tools;

// Adapter giữa MAF tool calling và CQRS query. Nghiệp vụ vẫn nằm trong query handler.
internal sealed class CvQueryTools
{
    private readonly ISender _sender;

    public CvQueryTools(ISender sender)
    {
        _sender = sender;
    }

    [Description(
        "Lấy hồ sơ ứng viên - Profile của ứng viên đang đăng nhập hiện tại. " +
        "Gọi trước khi tư vấn hoặc tạo nội dung CV cần dữ liệu hồ sơ thật.")]
    public Task<Response<GetAllHoSoUngViensViewModel>> GetMyProfileAsync(
        CancellationToken cancellationToken = default)
    {
        return _sender.Send(new GetMyHoSoUngVienQuery(), cancellationToken);
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

    [Description(
        "Gợi ý mẫu CV phù hợp với hồ sơ của ứng viên (ưu tiên CV mặc định). " +
        "Trả về top mẫu kèm điểm phù hợp và lý do chọn (ngành, cấp bậc, ATS). " +
        "Dùng khi người dùng hỏi 'mẫu CV nào hợp với tôi', 'nên dùng theme nào'. " +
        "Áp dụng mẫu bằng frontend tool setCvTemplate, chỉ khi người dùng đồng ý.")]
    public Task<Response<List<SuggestedCvThemeViewModel>>> SuggestCvThemeAsync(
        [Description("ID CV cụ thể cần gợi ý mẫu; bỏ trống để dùng CV mặc định")] int? cvId,
        [Description("Vị trí ứng tuyển muốn nhắm tới (vd: Backend Developer); bỏ trống để lấy từ hồ sơ")] string viTri,
        CancellationToken cancellationToken = default)
    {
        return _sender.Send(
            new GetSuggestedCvThemesQuery { CvUngVienId = cvId, ViTri = viTri, TopN = 3 },
            cancellationToken);
    }
}
