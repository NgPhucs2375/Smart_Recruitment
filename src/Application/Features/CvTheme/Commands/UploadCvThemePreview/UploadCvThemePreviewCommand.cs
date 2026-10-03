using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CvTheme.Commands.UploadCvThemePreview;

public class UploadCvThemePreviewCommand : IRequest<Response<string>>
{
    public int ThemeId { get; set; }
    public IFormFile File { get; set; }
}

public class UploadCvThemePreviewCommandHandler(
    IApplicationDbContext context,
    IFileStorageService storage)
    : IRequestHandler<UploadCvThemePreviewCommand, Response<string>>
{
    private static readonly string[] AllowedTypes =
    {
        "image/jpeg", "image/png", "image/webp", "image/gif"
    };

    private const long MaxBytes = 5 * 1024 * 1024;

    public async Task<Response<string>> Handle(
        UploadCvThemePreviewCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await context.CvThemes
            .FindAsync([request.ThemeId], cancellationToken);

        if (entity == null)
        {
            return new Response<string>(
                "Không tìm thấy theme CV.");
        }

        // DbContext NoTracking toàn cục: Find/FirstOrDefault trả về entity
        // không track — Attach cùng reference (không throw duplicate-track).
        context.CvThemes.Attach(entity);

        if (request.File == null || request.File.Length == 0)
        {
            return new Response<string>(
                "File ảnh preview là bắt buộc.");
        }

        if (!AllowedTypes.Contains(request.File.ContentType))
        {
            return new Response<string>(
                "Chỉ chấp nhận ảnh jpeg/png/webp/gif.");
        }

        if (request.File.Length > MaxBytes)
        {
            return new Response<string>(
                "Ảnh preview vượt quá 5MB.");
        }

        var ext = Path.GetExtension(request.File.FileName).ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(ext) || ext.Length > 5)
        {
            ext = ".webp";
        }

        var objectName = $"cv-themes/{entity.Slug}/{Guid.NewGuid():N}{ext}";

        await using var stream = request.File.OpenReadStream();

        await storage.UploadAsync(
            stream,
            objectName,
            request.File.ContentType,
            request.File.Length,
            cancellationToken);

        if (!string.IsNullOrWhiteSpace(entity.PreviewStorageKey) &&
            entity.PreviewStorageKey.StartsWith("cv-themes/"))
        {
            await storage.DeleteAsync(
                entity.PreviewStorageKey,
                cancellationToken);
        }

        entity.PreviewStorageKey = objectName;

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<string>(
            data: objectName,
            message: "Tải ảnh preview thành công.");
    }
}
