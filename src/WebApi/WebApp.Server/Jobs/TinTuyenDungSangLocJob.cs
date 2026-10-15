using Application.Features.KetQuaPhuHop.Cache;
using Application.Interfaces;
using Application.Services.StateMachineTinTuyenDung;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace WebApp.Server.Jobs;

/// <summary>Retries system screening, including existing posts requeued by migration.</summary>
public class TinTuyenDungSangLocJob(IServiceScopeFactory scopes, ILogger<TinTuyenDungSangLocJob> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(30));
        do
        {
            try { await ProcessQueueAsync(stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex) { logger.LogWarning(ex, "Không đọc được hàng đợi sàng lọc tin."); }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task ProcessQueueAsync(CancellationToken ct)
    {
        List<int> ids;
        using (var scope = scopes.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
            ids = await db.TinTuyenDungs.AsNoTracking()
                .Where(x => x.TrangThai == TrangThaiTinTuyenDung.ChoDuyetHeThong &&
                    (x.NgayHetHan == null || x.NgayHetHan > DateTime.UtcNow))
                .OrderBy(x => x.LastModified ?? x.Created).Take(20).Select(x => x.Id).ToListAsync(ct);
        }
        foreach (var id in ids)
        {
            using var scope = scopes.CreateScope();
            try
            {
                var services = scope.ServiceProvider;
                var db = services.GetRequiredService<IApplicationDbContext>();
                var job = await db.TinTuyenDungs.AsTracking().Include(x => x.NguoiDangTin)
                    .FirstOrDefaultAsync(x => x.Id == id && x.TrangThai == TrangThaiTinTuyenDung.ChoDuyetHeThong, ct);
                if (job == null) continue;
                var machine = new TinTuyenDungStateMachine(services.GetRequiredService<ITinTuyenDungWorkflowService>(),
                    services.GetRequiredService<ICurrentNguoiDungService>(), job);
                await JobScreening.RunAsync(job, machine, services.GetRequiredService<ITinTuyenDungFunnelService>(), ct);
                await db.SaveChangesAsync(ct);
                if (job.TrangThai != TrangThaiTinTuyenDung.ChoDuyetHeThong)
                    await RecommendationCache.InvalidateJobsAsync(services.GetRequiredService<IDistributedCache>(), ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
            catch (Exception ex) { logger.LogWarning(ex, "Sàng lọc tin #{TinId} chưa hoàn tất; sẽ thử lại.", id); }
        }
    }
}
