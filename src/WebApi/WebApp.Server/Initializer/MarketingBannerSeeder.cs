using System.Text;
using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace WebApp.Server.Initializer;

public static class MarketingBannerSeeder
{
    private const string ObjectName = "marketing-banners/demo-careerhub.svg";

    public static async Task SeedAsync(
        ApplicationDbContext dbContext,
        IFileStorageService storage,
        CancellationToken cancellationToken = default)
    {
        if (await dbContext.MarketingBanners.AnyAsync(cancellationToken)) return;

        var svg = """
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 600">
              <defs>
                <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stop-color="#172554"/>
                  <stop offset="0.55" stop-color="#2563eb"/>
                  <stop offset="1" stop-color="#06b6d4"/>
                </linearGradient>
                <filter id="glow"><feGaussianBlur stdDeviation="28"/></filter>
              </defs>
              <rect width="1600" height="600" fill="url(#bg)"/>
              <circle cx="1320" cy="80" r="210" fill="#67e8f9" opacity=".28" filter="url(#glow)"/>
              <circle cx="1480" cy="520" r="260" fill="#a5f3fc" opacity=".2" filter="url(#glow)"/>
              <path d="M1040 600 1480 120 1600 180V600Z" fill="#fff" opacity=".08"/>
              <text x="110" y="220" fill="#bae6fd" font-family="Arial,sans-serif" font-size="30" font-weight="700" letter-spacing="6">CAREERHUB</text>
              <text x="110" y="320" fill="#fff" font-family="Arial,sans-serif" font-size="68" font-weight="700">Build your next career move</text>
              <text x="110" y="385" fill="#e0f2fe" font-family="Arial,sans-serif" font-size="30">Discover opportunities that match your ambition.</text>
              <rect x="110" y="440" width="230" height="64" rx="32" fill="#fff"/>
              <text x="160" y="482" fill="#1d4ed8" font-family="Arial,sans-serif" font-size="24" font-weight="700">Explore jobs</text>
            </svg>
            """;

        var bytes = Encoding.UTF8.GetBytes(svg);
        await using var stream = new MemoryStream(bytes);
        await storage.UploadAsync(stream, ObjectName, "image/svg+xml", bytes.Length, cancellationToken);

        dbContext.MarketingBanners.Add(new MarketingBanner
        {
            Title = "Build your next career move",
            Description = "Discover opportunities that match your ambition.",
            LinkUrl = "/tin-tuyen-dung",
            MediaObjectName = ObjectName,
            MediaType = "image/svg+xml",
            IsActive = true,
        });

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
