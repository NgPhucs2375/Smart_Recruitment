using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CVUngVien.Commands.PrepareCvImport;

public class PrepareCvImportCommand : IRequest<Response<PrepareCvImportResult>>
{
    public int HoSoUngVienId { get; set; }
    public IFormFile File { get; set; }
}

public class PrepareCvImportResult
{
    public Guid SessionId { get; set; }
    public DateTime ExpiresAt { get; set; }
}

public class PrepareCvImportCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService currentNguoiDungService,
    IFileStorageService fileStorageService)
    : IRequestHandler<PrepareCvImportCommand, Response<PrepareCvImportResult>>
{
    private const long MaxFileSize = 10 * 1024 * 1024;
    private static readonly HashSet<string> AllowedExtensions =
        new(StringComparer.OrdinalIgnoreCase) { ".pdf", ".docx", ".json" };

    public async Task<Response<PrepareCvImportResult>> Handle(
        PrepareCvImportCommand request,
        CancellationToken cancellationToken)
    {
        if (request.File == null || request.File.Length == 0)
            return new Response<PrepareCvImportResult>("File CV rỗng.");
        if (request.File.Length > MaxFileSize)
            return new Response<PrepareCvImportResult>("File CV không được vượt quá 10 MB.");

        var extension = Path.GetExtension(request.File.FileName);
        if (!AllowedExtensions.Contains(extension))
            return new Response<PrepareCvImportResult>("Chỉ hỗ trợ file PDF, DOCX hoặc JSON.");

        var currentUser = await currentNguoiDungService.ResolveAsync();
        var hoSo = await context.HoSoUngViens.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.HoSoUngVienId, cancellationToken);
        if (hoSo == null)
            return new Response<PrepareCvImportResult>("Hồ sơ ứng viên không tồn tại.");
        if (currentUser.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN && hoSo.NguoiDungId != currentUser.Id)
            return new Response<PrepareCvImportResult>("Bạn không có quyền thao tác trên hồ sơ ứng viên này.");

        var sessionId = Guid.NewGuid();
        var objectKey = $"staging/cvs/{currentUser.Id}/{sessionId:N}/original{extension.ToLowerInvariant()}";
        await using var stream = request.File.OpenReadStream();
        await fileStorageService.UploadAsync(
            stream,
            objectKey,
            string.IsNullOrWhiteSpace(request.File.ContentType) ? "application/octet-stream" : request.File.ContentType,
            request.File.Length,
            cancellationToken);

        var now = DateTime.UtcNow;
        var session = new CVImportSession
        {
            Id = sessionId,
            HoSoUngVienId = hoSo.Id,
            NguoiDungId = currentUser.Id,
            OriginalObjectKey = objectKey,
            OriginalFileName = Path.GetFileName(request.File.FileName),
            OriginalContentType = string.IsNullOrWhiteSpace(request.File.ContentType)
                ? "application/octet-stream"
                : request.File.ContentType,
            OriginalFileSize = request.File.Length,
            TrangThai = TrangThaiCvImport.Uploaded,
            CreatedAt = now,
            ExpiresAt = now.AddHours(24)
        };

        try
        {
            await context.CVImportSessions.AddAsync(session, cancellationToken);
            await context.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            await fileStorageService.DeleteAsync(objectKey, cancellationToken);
            throw;
        }

        return new Response<PrepareCvImportResult>(new PrepareCvImportResult
        {
            SessionId = session.Id,
            ExpiresAt = session.ExpiresAt
        }, "Đã lưu file CV gốc.");
    }
}
