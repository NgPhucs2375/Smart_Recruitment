using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Infrastructure.Identity.Contexts;
using Infrastructure.Persistence.Contexts;

namespace WebApp.Server.Health
{
    /// <summary>
    /// Readiness check: xác nhận cả hai DbContext kết nối được database.
    /// Không chạy migration, không trả về connection string hay exception nội bộ
    /// (HealthCheckOptions mặc định chỉ ghi Healthy/Unhealthy).
    /// </summary>
    public sealed class DatabaseReadinessHealthCheck(IServiceProvider serviceProvider) : IHealthCheck
    {
        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                using var scope = serviceProvider.CreateScope();
                var appDb = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                var identityDb = scope.ServiceProvider.GetRequiredService<IdentityContext>();

                var appOk = await appDb.Database.CanConnectAsync(cancellationToken);
                var identityOk = await identityDb.Database.CanConnectAsync(cancellationToken);

                return appOk && identityOk
                    ? HealthCheckResult.Healthy("Database reachable.")
                    : HealthCheckResult.Unhealthy("Database unreachable.");
            }
            catch (Exception ex)
            {
                return HealthCheckResult.Unhealthy("Database check failed.", ex);
            }
        }
    }
}
