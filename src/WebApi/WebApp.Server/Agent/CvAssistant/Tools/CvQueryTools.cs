using System.ComponentModel;
using Application.DTOs.CV;
using Application.Features.CVUngVien.Queries.GetCVUngVienById;
using Application.Features.HoSoUngVien.Queries.GetAllHoSoUngViens;
using Application.Features.HoSoUngVien.Queries.GetMyHoSoUngVien;
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
}
