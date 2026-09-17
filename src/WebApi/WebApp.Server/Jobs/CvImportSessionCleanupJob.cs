using Application.Interfaces;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace WebApp.Server.Jobs;

public class CvImportSessionCleanupJob(
    IServiceScopeFactory scopes,
    ILogger<CvImportSessionCleanupJob> logger)
    : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        do
        {
            try
            {
                await CleanupAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Lỗi khi dọn các phiên import CV hết hạn.");
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task CleanupAsync(CancellationToken cancellationToken)
    {
        using var scope = scopes.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var storage = scope.ServiceProvider.GetRequiredService<IFileStorageService>();
        var sessions = await context.CVImportSessions.AsTracking()
            .Where(x => x.TrangThai != TrangThaiCvImport.Confirmed &&
                        x.TrangThai != TrangThaiCvImport.Expired &&
                        x.ExpiresAt <= DateTime.UtcNow)
            .ToListAsync(cancellationToken);

        foreach (var session in sessions)
        {
            try
            {
                await storage.DeleteAsync(session.OriginalObjectKey, cancellationToken);
                session.TrangThai = TrangThaiCvImport.Expired;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Không thể xóa file staging của phiên CV {SessionId}.", session.Id);
            }
        }

        if (sessions.Any(x => x.TrangThai == TrangThaiCvImport.Expired))
            await context.SaveChangesAsync(cancellationToken);
    }
}
