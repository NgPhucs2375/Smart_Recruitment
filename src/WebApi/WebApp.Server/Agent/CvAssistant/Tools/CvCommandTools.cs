using System.ComponentModel;
using Application.DTOs.CV;
using Application.Features.CVUngVien.Commands.CreateCVByAgent;
using Application.Wrappers;
using MediatR;

namespace WebApp.Server.Agent.CvAssistant.Tools;

// Tool có tác dụng phụ được tách khỏi query tools để dễ áp dụng approval/audit riêng.
internal sealed class CvCommandTools
{
    private readonly ISender _sender;

    public CvCommandTools(ISender sender)
    {
        _sender = sender;
    }

    [Description(
        "Lưu một CV mới do AI hỗ trợ tạo. " +
        "Chỉ gọi sau khi người dùng đã xác nhận rõ ràng muốn lưu.")]
    public Task<Response<int>> CreateCvAsync(
        [Description("Tên CV, ví dụ: CV Backend Developer 2026")] string tenFile,
        [Description("ID template; bỏ trống để dùng template mặc định hiện tại")] string? templateId,
        [Description("Nội dung CV đầy đủ gồm liên hệ, học vấn, kinh nghiệm, dự án, kỹ năng và chứng chỉ")]
        ParsedCvDto noiDung,
        CancellationToken cancellationToken = default)
    {
        return _sender.Send(
            new CreateCVByAgentCommand
            {
                TenFile = tenFile,
                TemplateId = templateId,
                NoiDung = noiDung
            },
            cancellationToken);
    }
}
