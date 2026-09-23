using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.HoSoUngVien.Commands.UpdateHoSoUngVienAvatar;

public class UpdateHoSoUngVienAvatarCommand : IRequest<Response<string>>
{
    public int HoSoUngVienId { get; set; }
    public IFormFile File { get; set; } = null!;
}

public class DeleteHoSoUngVienAvatarCommand : IRequest<Response<int>>
{
    public int HoSoUngVienId { get; set; }
}

public class UpdateHoSoUngVienAvatarCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current,
    IFileStorageService storage)
    : IRequestHandler<UpdateHoSoUngVienAvatarCommand, Response<string>>,
      IRequestHandler<DeleteHoSoUngVienAvatarCommand, Response<int>>
{
    private const long MaxFileSize = 5 * 1024 * 1024;
    private static readonly HashSet<string> AllowedContentTypes =
    [
        "image/jpeg", "image/png", "image/webp", "image/gif"
    ];

    public async Task<Response<string>> Handle(
        UpdateHoSoUngVienAvatarCommand request,
        CancellationToken cancellationToken)
    {
        if (request.File == null || request.File.Length == 0)
            return new Response<string>("Vui lòng chọn ảnh đại diện.");
        if (request.File.Length > MaxFileSize)
            return new Response<string>("Ảnh đại diện không được vượt quá 5MB.");

        var contentType = request.File.ContentType.ToLowerInvariant();
        if (!AllowedContentTypes.Contains(contentType))
            return new Response<string>("Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF.");

        var profile = await GetOwnedProfile(request.HoSoUngVienId, cancellationToken);
        if (profile == null)
            return new Response<string>("Không tìm thấy hồ sơ hoặc bạn không có quyền cập nhật.");

        // DbContext NoTracking toàn cục: Find/FirstOrDefault trả về entity
        // không track — Attach cùng reference (không throw duplicate-track).
        context.HoSoUngViens.Attach(profile);

        var extension = contentType switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            "image/gif" => ".gif",
            _ => throw new InvalidOperationException()
        };
        var objectName = $"avatars/{profile.Id}/{Guid.NewGuid():N}{extension}";

        await using var stream = request.File.OpenReadStream();
        await storage.UploadAsync(
            stream, objectName, contentType, request.File.Length, cancellationToken);

        var oldObjectName = profile.AnhDaiDienUrl;
        profile.AnhDaiDienUrl = objectName;
        await context.SaveChangesAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(oldObjectName) && oldObjectName.StartsWith("avatars/"))
        {
            try { await storage.DeleteAsync(oldObjectName, cancellationToken); }
            catch { /* Avatar mới đã lưu; file cũ có thể được dọn sau. */ }
        }

        return new Response<string>(objectName, "Cập nhật ảnh đại diện thành công.");
    }

    public async Task<Response<int>> Handle(
        DeleteHoSoUngVienAvatarCommand request,
        CancellationToken cancellationToken)
    {
        var profile = await GetOwnedProfile(request.HoSoUngVienId, cancellationToken);
        if (profile == null)
            return new Response<int>("Không tìm thấy hồ sơ hoặc bạn không có quyền cập nhật.");

        // DbContext NoTracking toàn cục: Find/FirstOrDefault trả về entity
        // không track — Attach cùng reference (không throw duplicate-track).
        context.HoSoUngViens.Attach(profile);

        var oldObjectName = profile.AnhDaiDienUrl;
        profile.AnhDaiDienUrl = null;
        await context.SaveChangesAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(oldObjectName) && oldObjectName.StartsWith("avatars/"))
            await storage.DeleteAsync(oldObjectName, cancellationToken);

        return new Response<int>(profile.Id, "Đã xóa ảnh đại diện.");
    }

    private async Task<Domain.Entities.HoSoUngVien> GetOwnedProfile(
        int profileId,
        CancellationToken cancellationToken)
    {
        var user = await current.ResolveAsync();
        return await context.HoSoUngViens.FirstOrDefaultAsync(
            profile => profile.Id == profileId &&
                (user.VaiTro == VaiTroNguoiDung.QUAN_TRI_VIEN || profile.NguoiDungId == user.Id),
            cancellationToken);
    }
}
