using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CvTheme.Commands.DeleteCvTheme;

public class DeleteCvThemeByIdCommand : IRequest<Response<int>>
{
    public int Id { get; set; }
}

public class DeleteCvThemeByIdCommandHandler(
    IApplicationDbContext context,
    IFileStorageService storage)
    : IRequestHandler<DeleteCvThemeByIdCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        DeleteCvThemeByIdCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await context.CvThemes
            .FindAsync([request.Id], cancellationToken);

        if (entity == null)
        {
            return new Response<int>(
                "Không tìm thấy theme CV.");
        }

        // TemplateId lưu dạng string tự do ở CV — chặn xóa theme đang dùng.
        var dangSuDung = await context.CVUngViens
            .AsNoTracking()
            .AnyAsync(
                x => x.TemplateId == entity.Slug,
                cancellationToken);

        if (dangSuDung)
        {
            return new Response<int>(
                "Không thể xóa theme đang được CV sử dụng. Hãy tắt (IsActive=false) thay vì xóa.");
        }

        if (!string.IsNullOrWhiteSpace(entity.PreviewStorageKey) &&
            entity.PreviewStorageKey.StartsWith("cv-themes/"))
        {
            await storage.DeleteAsync(
                entity.PreviewStorageKey,
                cancellationToken);
        }

        context.CvThemes.Remove(entity);

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Xóa theme CV thành công.");
    }
}
