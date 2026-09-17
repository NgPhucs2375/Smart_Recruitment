using Application.DTOs.CV;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CVUngVien.Commands.CreateCVByAgent;

// Command dành riêng cho AI agent: tạo CV từ nội dung có cấu trúc (ParsedCvDto)
// mà không cần upload PDF — khác CreateCVUngVienCommand vốn bắt buộc IFormFile.
public class CreateCVByAgentCommand : IRequest<Response<int>>
{
    public string TenFile { get; set; } = string.Empty;
    public string? TemplateId { get; set; }
    public ParsedCvDto NoiDung { get; set; } = null!;
}

public class CreateCVByAgentCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService currentNguoiDungService)
    : IRequestHandler<CreateCVByAgentCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        CreateCVByAgentCommand request,
        CancellationToken cancellationToken)
    {
        var currentUser = await currentNguoiDungService.ResolveAsync();
        var hoSo = await context.HoSoUngViens
            .FirstOrDefaultAsync(x => x.NguoiDungId == currentUser.Id, cancellationToken);
        if (hoSo == null)
        {
            return new Response<int>("Bạn chưa có hồ sơ ứng viên. Hãy tạo hồ sơ trước khi lưu CV.");
        }

        var skillIds = CvEntityMapper.GetKyNangIds(request.NoiDung);
        var validSkillIds = await context.KyNangs.AsNoTracking()
            .Where(x => skillIds.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);
        var invalidSkillIds = skillIds.Except(validSkillIds).ToList();
        if (invalidSkillIds.Count > 0)
        {
            return new Response<int>($"Không tìm thấy kỹ năng có ID: {string.Join(", ", invalidSkillIds)}.");
        }

        var templateId = request.TemplateId;
        if (string.IsNullOrWhiteSpace(templateId))
        {
            templateId = await context.CVUngViens.AsNoTracking()
                .Where(x => x.HoSoUngVienId == hoSo.Id && !x.IsDaXoa && x.IsDefault)
                .Select(x => x.TemplateId)
                .FirstOrDefaultAsync(cancellationToken) ?? "default";
        }

        var oldDefaults = await context.CVUngViens
            .Where(x => x.HoSoUngVienId == hoSo.Id && x.IsDefault && !x.IsDaXoa)
            .ToListAsync(cancellationToken);
        oldDefaults.ForEach(x => x.IsDefault = false);

        var entity = new Domain.Entities.CVUngVien
        {
            HoSoUngVienId = hoSo.Id,
            TenFile = request.TenFile.Trim(),
            FileUrl = null,
            TemplateId = templateId,
            IsDefault = true,
            PhuongThucTao = PhuongThucTaoCV.AIAgentHoTro,
            StorageKey = string.Empty,
            FileMimeType = string.Empty,
            FileSize = 0
        };
        CvEntityMapper.ApplyContent(entity, request.NoiDung);

        await context.CVUngViens.AddAsync(entity, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return new Response<int>(entity.Id, "Đã lưu CV mới.");
    }
}
