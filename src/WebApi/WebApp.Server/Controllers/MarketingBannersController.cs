using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using Infrastructure.Persistence.Contexts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace WebApp.Server.Controllers;

[ApiController]
[Route("api/marketingbanners")]
public sealed class MarketingBannersController(
    ApplicationDbContext db,
    IFileStorageService storage
) : ControllerBase
{
    private const long MaxMediaBytes = 100 * 1024 * 1024;

    [Authorize]
    [HttpGet("active")]
    public async Task<IActionResult> GetActive(CancellationToken cancellationToken)
    {
        var banner = await db.MarketingBanners
            .AsNoTracking()
            .Where(item => item.IsActive)
            .OrderByDescending(item => item.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (banner == null) return NotFound();
        return Ok(new Response<MarketingBannerView>(await ToViewAsync(banner, cancellationToken)));
    }

    [Authorize(Roles = "QUAN_TRI_VIEN")]
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var banners = await db.MarketingBanners
            .AsNoTracking()
            .OrderByDescending(item => item.Id)
            .ToListAsync(cancellationToken);

        var result = new List<MarketingBannerView>(banners.Count);
        foreach (var banner in banners)
            result.Add(await ToViewAsync(banner, cancellationToken));

        return Ok(new Response<IReadOnlyList<MarketingBannerView>>(result));
    }

    [Authorize(Roles = "QUAN_TRI_VIEN")]
    [HttpPost]
    [RequestSizeLimit(MaxMediaBytes)]
    public async Task<IActionResult> Create(
        [FromForm] string? title,
        [FromForm] string? description,
        [FromForm] string? linkUrl,
        [FromForm] IFormFile? media,
        CancellationToken cancellationToken)
    {
        if (media == null || media.Length == 0)
            return BadRequest(new Response<string>("Vui lòng chọn ảnh hoặc video cho banner."));
        if (media.Length > MaxMediaBytes)
            return BadRequest(new Response<string>("File banner không được vượt quá 100 MB."));
        if (!IsSupportedMedia(media.ContentType, media.FileName))
            return BadRequest(new Response<string>("Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc video MP4, WEBM."));

        var extension = Path.GetExtension(media.FileName).ToLowerInvariant();
        var objectName = $"marketing-banners/{Guid.NewGuid():N}{extension}";
        await using var stream = media.OpenReadStream();
        await storage.UploadAsync(stream, objectName, media.ContentType, media.Length, cancellationToken);

        var activeBanners = await db.MarketingBanners
            .Where(item => item.IsActive)
            .ToListAsync(cancellationToken);
        foreach (var item in activeBanners) item.IsActive = false;

        var banner = new MarketingBanner
        {
            Title = title?.Trim() ?? string.Empty,
            Description = description?.Trim() ?? string.Empty,
            LinkUrl = linkUrl?.Trim() ?? string.Empty,
            MediaObjectName = objectName,
            MediaType = media.ContentType,
            IsActive = true,
        };
        db.MarketingBanners.Add(banner);
        await db.SaveChangesAsync(cancellationToken);

        return Ok(new Response<MarketingBannerView>(await ToViewAsync(banner, cancellationToken)));
    }

    [Authorize(Roles = "QUAN_TRI_VIEN")]
    [HttpPut("{id:int}/active")]
    public async Task<IActionResult> SetActive(int id, CancellationToken cancellationToken)
    {
        var banner = await db.MarketingBanners.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (banner == null) return NotFound();

        var activeBanners = await db.MarketingBanners
            .Where(item => item.IsActive)
            .ToListAsync(cancellationToken);
        foreach (var item in activeBanners) item.IsActive = false;
        banner.IsActive = true;
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new Response<string>("Đã chọn banner hiển thị."));
    }

    [Authorize(Roles = "QUAN_TRI_VIEN")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var banner = await db.MarketingBanners.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (banner == null) return NotFound();

        db.MarketingBanners.Remove(banner);
        await db.SaveChangesAsync(cancellationToken);
        await storage.DeleteAsync(banner.MediaObjectName, cancellationToken);
        return Ok(new Response<string>("Đã xóa banner."));
    }

    private async Task<MarketingBannerView> ToViewAsync(
        MarketingBanner banner,
        CancellationToken cancellationToken)
    {
        return new MarketingBannerView(
            banner.Id,
            banner.Title,
            banner.Description,
            banner.MediaType,
            banner.LinkUrl,
            banner.IsActive,
            await storage.CreatePresignedUrlAsync(banner.MediaObjectName, 900, cancellationToken));
    }

    private static bool IsSupportedMedia(string contentType, string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase)
            && extension is ".jpg" or ".jpeg" or ".png" or ".webp"
            || contentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase)
            && extension is ".mp4" or ".webm";
    }
}

public sealed record MarketingBannerView(
    int Id,
    string Title,
    string Description,
    string MediaType,
    string LinkUrl,
    bool IsActive,
    string MediaUrl);
