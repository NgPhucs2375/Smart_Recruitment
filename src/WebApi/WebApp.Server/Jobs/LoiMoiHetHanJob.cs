using Application.Interfaces;
using Application.Services.StateMachineLoiMoi;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace WebApp.Server.Jobs
{
    /// <summary>
    /// Job quét lời mời ChoXacNhan quá NgayHetHan -&gt; fire DanhDauHetHan (system, bypass auth).
    /// Chạy mỗi giờ sau khi app khởi động.
    /// </summary>
    public class LoiMoiHetHanJob : BackgroundService
    {
        private readonly IServiceScopeFactory _scopes;
        private readonly ILogger<LoiMoiHetHanJob> _logger;
        private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

        public LoiMoiHetHanJob(IServiceScopeFactory scopes, ILogger<LoiMoiHetHanJob> logger)
        {
            _scopes = scopes;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            using var timer = new PeriodicTimer(Interval);
            do
            {
                try
                {
                    await QuetHetHanAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi quét lời mời nhân sự hết hạn.");
                }
            } while (await timer.WaitForNextTickAsync(stoppingToken));
        }

        private async Task QuetHetHanAsync(CancellationToken ct)
        {
            using var scope = _scopes.CreateScope();
            await LoiMoiHetHanSweeper.QuetAsync(
                scope.ServiceProvider.GetRequiredService<IApplicationDbContext>(),
                scope.ServiceProvider.GetRequiredService<ILoiMoiNhanSuWorkflowService>(),
                scope.ServiceProvider.GetRequiredService<ICurrentNguoiDungService>(),
                _logger, ct);
        }
    }
}
