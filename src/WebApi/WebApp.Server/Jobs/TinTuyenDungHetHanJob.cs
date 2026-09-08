using Application.Interfaces;
using Application.Services.StateMachineTinTuyenDung;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
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
    /// Job quét tin DangTuyen/TamDung quá NgayHetHan -&gt; fire HetHanNop (system, bypass auth).
    /// Chạy mỗi giờ sau khi app khởi động.
    /// </summary>
    public class TinTuyenDungHetHanJob : BackgroundService
    {
        private readonly IServiceScopeFactory _scopes;
        private readonly ILogger<TinTuyenDungHetHanJob> _logger;
        private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

        public TinTuyenDungHetHanJob(IServiceScopeFactory scopes, ILogger<TinTuyenDungHetHanJob> logger)
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
                    _logger.LogError(ex, "Lỗi khi quét tin tuyển dụng hết hạn.");
                }
            } while (await timer.WaitForNextTickAsync(stoppingToken));
        }

        private async Task QuetHetHanAsync(CancellationToken ct)
        {
            using var scope = _scopes.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
            var workflow = scope.ServiceProvider.GetRequiredService<ITinTuyenDungWorkflowService>();
            var current = scope.ServiceProvider.GetRequiredService<ICurrentNguoiDungService>();

            var now = DateTime.UtcNow;
            var quaHan = await context.TinTuyenDungs
                .Where(t => t.NgayHetHan != null && t.NgayHetHan < now
                    && (t.TrangThai == TrangThaiTinTuyenDung.DangTuyen
                        || t.TrangThai == TrangThaiTinTuyenDung.TamDung))
                .ToListAsync(ct);

            foreach (var tin in quaHan)
            {
                try
                {
                    var machine = new TinTuyenDungStateMachine(workflow, current, tin);
                    await machine.FireSystemAsync(TriggerTinTuyenDung.HetHanNop, "Hết hạn nhận hồ sơ (job tự động).", ct);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Không thể đóng tin hết hạn #{TinId}.", tin.Id);
                }
            }

            if (quaHan.Count > 0)
                await context.SaveChangesAsync(ct);
        }
    }
}
