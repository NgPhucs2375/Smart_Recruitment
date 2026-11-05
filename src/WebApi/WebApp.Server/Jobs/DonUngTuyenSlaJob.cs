using Application.Interfaces;
using Application.Interfaces.Repositories;
using Application.Services.StateMachineDonUngTuyen;

namespace WebApp.Server.Jobs;

/// <summary>
/// Job quét đơn ứng tuyển bị HR ngâm quá hạn SLA -> fire HetHanXuLy (system, bypass auth)
/// và nhắc người đăng tin một lần khi sắp tới hạn. Quét ngay khi app khởi động,
/// sau đó lặp theo Sla:DonUngTuyen:IntervalPhut.
/// </summary>
public class DonUngTuyenSlaJob(
    IServiceScopeFactory scopes,
    IConfiguration configuration,
    ILogger<DonUngTuyenSlaJob> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var interval = TimeSpan.FromMinutes(Math.Clamp(configuration.GetValue("Sla:DonUngTuyen:IntervalPhut", 60), 1, 1440));
        using var timer = new PeriodicTimer(interval);
        do
        {
            try { await QuetAsync(stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex) { logger.LogError(ex, "Lỗi khi quét SLA đơn ứng tuyển."); }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task QuetAsync(CancellationToken ct)
    {
        var options = new DonUngTuyenSlaOptions(
            Math.Clamp(configuration.GetValue("Sla:DonUngTuyen:SoNgayChoXuLy", 7), 1, 365),
            Math.Clamp(configuration.GetValue("Sla:DonUngTuyen:SoNgayDaXem", 14), 1, 365),
            Math.Clamp(configuration.GetValue("Sla:DonUngTuyen:TyLeNhan", 80), 1, 99),
            Math.Clamp(configuration.GetValue("Sla:DonUngTuyen:SoLuongToiDaMoiLuot", 50), 1, 500));

        using var scope = scopes.CreateScope();
        var (soHetHan, soDaNac) = await DonUngTuyenSlaSweeper.QuetAsync(
            scope.ServiceProvider.GetRequiredService<IApplicationDbContext>(),
            scope.ServiceProvider.GetRequiredService<IDonUngTuyenWorkflowService>(),
            scope.ServiceProvider.GetRequiredService<ICurrentNguoiDungService>(),
            scope.ServiceProvider.GetRequiredService<INotificationService>(),
            logger, options, ct);

        if (soHetHan > 0 || soDaNac > 0)
            logger.LogInformation("Job SLA đơn ứng tuyển: {SoHetHan} đơn quá hạn, {SoDaNac} đơn vừa nhắc việc.", soHetHan, soDaNac);
    }
}
