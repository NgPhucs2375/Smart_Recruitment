using Application.Features.KetQuaPhuHop.Fanout;
using Application.Interfaces;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace WebApp.Server.Jobs;

/// <summary>
/// Quét pool ứng viên cho các tin đang tuyển: tin mới lên sóng (chưa có dấu quét),
/// tin vừa sửa nội dung, hoặc tin đã lâu chưa quét lại.
/// </summary>
public class JobCandidateFanoutJob(
    IServiceScopeFactory scopes,
    IConfiguration configuration,
    ILogger<JobCandidateFanoutJob> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(30));
        do
        {
            try { await ProcessQueueAsync(stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex) { logger.LogWarning(ex, "Không đọc được hàng đợi quét ứng viên."); }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task ProcessQueueAsync(CancellationToken ct)
    {
        var jobsPerTick = Math.Clamp(configuration.GetValue("Recommendation:JobsPerTick", 5), 1, 20);
        var grace = TimeSpan.FromMinutes(Math.Clamp(configuration.GetValue("Recommendation:RequeueGraceMinutes", 10), 1, 240));
        var sweep = TimeSpan.FromHours(Math.Clamp(configuration.GetValue("Recommendation:SweepIntervalHours", 6), 1, 168));

        var options = new FanoutOptions
        {
            TopKPerJob = Math.Clamp(configuration.GetValue("Recommendation:TopKPerJob", 20), 1, 100),
            TopJobsPerCandidate = Math.Clamp(configuration.GetValue("Recommendation:TopJobsPerCandidate", 3), 0, 50),
            DailyNotifyBudgetPerCandidate = Math.Clamp(
                configuration.GetValue("Recommendation:DailyNotifyBudgetPerCandidate", 3), 1, 50),
        };

        List<int> ids;
        using (var scope = scopes.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
            var now = DateTime.UtcNow;
            // LastModified bị đóng dấu ở mọi lần save nên lượt quét tự làm mới dấu
            // của chính nó: phải có grace, nếu không tin sẽ tự xếp hàng mãi mãi.
            ids = await db.TinTuyenDungs.AsNoTracking()
                .Where(x => x.TrangThai == TrangThaiTinTuyenDung.DangTuyen &&
                            (x.NgayHetHan == null || x.NgayHetHan > now) &&
                            ((x.QuatUngVienLucCuoi == null && (x.LastModified ?? x.Created) < now.AddSeconds(-5)) ||
                             (x.QuatUngVienLucCuoi != null && (x.LastModified ?? x.Created) > x.QuatUngVienLucCuoi.Value + grace) ||
                             (x.QuatUngVienLucCuoi != null && x.QuatUngVienLucCuoi < now - sweep)))
                .OrderBy(x => x.LastModified ?? x.Created)
                .Take(jobsPerTick)
                .Select(x => x.Id)
                .ToListAsync(ct);
        }

        foreach (var id in ids)
        {
            using var scope = scopes.CreateScope();
            try
            {
                await scope.ServiceProvider
                    .GetRequiredService<JobCandidateFanoutService>()
                    .RunAsync(id, options, ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
            catch (Exception ex) { logger.LogWarning(ex, "Quét ứng viên cho tin #{TinId} chưa hoàn tất; sẽ thử lại.", id); }
        }
    }
}
