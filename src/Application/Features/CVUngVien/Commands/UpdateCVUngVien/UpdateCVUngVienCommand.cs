using Application.DTOs.CV;
using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CVUngVien.Commands.UpdateCVUngVien;

public class UpdateCVUngVienCommand : IRequest<Response<int>>
{
    public int Id { get; set; }
    public string TenFile { get; set; }
    public string? TemplateId { get; set; }
    public bool IsDefault { get; set; }
    public ParsedCvDto NoiDung { get; set; }
}

public class UpdateCVUngVienCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService currentNguoiDungService)
    : IRequestHandler<UpdateCVUngVienCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        UpdateCVUngVienCommand request,
        CancellationToken cancellationToken)
    {
        var currentUser = await currentNguoiDungService.ResolveAsync();

        var entity = await context.CVUngViens
            .Include(x => x.HoSoUngVien)
            .Include(x => x.ThongTinLienHe)
            .Include(x => x.HocVans)
            .Include(x => x.KinhNghiems).ThenInclude(x => x.KyNangs)
            .Include(x => x.DuAns).ThenInclude(x => x.CongNghes)
            .Include(x => x.KyNangs)
            .Include(x => x.ChungChis)
            .FirstOrDefaultAsync(
                x => x.Id == request.Id &&
                     !x.IsDaXoa &&
                     x.HoSoUngVien.NguoiDungId == currentUser.Id,
                cancellationToken);

        if (entity == null)
        {
            return new Response<int>("Không tìm thấy CV.");
        }

        // DbContext NoTracking toàn cục: Find/FirstOrDefault trả về entity
        // không track — Attach cùng reference (không throw duplicate-track).
        context.CVUngViens.Attach(entity);

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

        if (request.IsDefault && !entity.IsDefault)
        {
            var oldDefaults = await context.CVUngViens
                .Where(x => x.HoSoUngVienId == entity.HoSoUngVienId &&
                            x.Id != entity.Id && x.IsDefault && !x.IsDaXoa)
                .ToListAsync(cancellationToken);
            foreach (var x in oldDefaults)
            {
                    context.CVUngViens.Attach(x);
            }
            oldDefaults.ForEach(x => x.IsDefault = false);
        }

        var isDefault = request.IsDefault;
        if (entity.IsDefault && !request.IsDefault)
        {
            var replacement = await context.CVUngViens
                .Where(x => x.HoSoUngVienId == entity.HoSoUngVienId &&
                            x.Id != entity.Id &&
                            !x.IsDaXoa)
                .OrderByDescending(x => x.Created)
                .FirstOrDefaultAsync(cancellationToken);

            if (replacement == null)
            {
                isDefault = true;
            }
            else
            {
                // DbContext NoTracking toàn cục: Find/FirstOrDefault trả về entity
                // không track — Attach cùng reference (không throw duplicate-track).
                context.CVUngViens.Attach(replacement);
                replacement.IsDefault = true;
            }
        }

        entity.TenFile = request.TenFile;
        entity.TemplateId = request.TemplateId;
        entity.IsDefault = isDefault;
        CvEntityMapper.ApplyContent(entity, request.NoiDung);

        await context.SaveChangesAsync(cancellationToken);
        return new Response<int>(data: entity.Id, message: "Cập nhật CV thành công.");
    }
}
