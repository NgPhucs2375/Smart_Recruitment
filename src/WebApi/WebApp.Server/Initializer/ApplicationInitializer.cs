using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Casbin;
using Infrastructure.Identity.Contexts;
using Infrastructure.Identity.Models;
using Infrastructure.Persistence.Contexts;

namespace WebApp.Server.Initializer
{
    public class ApplicationInitializer
    {
        private readonly IServiceProvider _serviceProvider;

        public ApplicationInitializer(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public async Task InitializeAsync()
        {
            // Dùng IConfiguration của host (gồm appsettings + env vars), không tự dựng
            // ConfigurationBuilder riêng để tránh lệch cấu hình production.
            // Logging dùng ILogger lifecycle của host (Serilog đã wire qua builder.Host).
            var configuration = _serviceProvider.GetRequiredService<IConfiguration>();
            var env = _serviceProvider.GetRequiredService<IWebHostEnvironment>();
            var logger = _serviceProvider.GetRequiredService<ILogger<ApplicationInitializer>>();
            try
            {
                var dbContext = _serviceProvider.GetRequiredService<ApplicationDbContext>();
                await dbContext.Database.MigrateAsync();
                var identityDbContext = _serviceProvider.GetRequiredService<IdentityContext>();
                await identityDbContext.Database.MigrateAsync();

                var userManager = _serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
                var roleManager = _serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
                var appContext = _serviceProvider.GetRequiredService<Application.Interfaces.IApplicationDbContext>();

                await Infrastructure.Identity.Seeds.DefaultRoles.SeedAsync(userManager, roleManager, env.WebRootPath);
                await Infrastructure.Identity.Seeds.DefaultSuperAdmin.SeedAsync(userManager, roleManager, appContext);
                await Infrastructure.Identity.Seeds.DefaultNguoiDaiDien.SeedAsync(userManager, roleManager, appContext);
                await Infrastructure.Identity.Seeds.DefaultBasicUser.SeedAsync(userManager, roleManager, appContext);
                await Infrastructure.Identity.Seeds.DefaultDemoData.SeedAsync(userManager, appContext);
                await Infrastructure.Identity.Seeds.DefaultBulkTestAccounts.SeedAsync(userManager, appContext);

                if (env.IsDevelopment())
                {
                    var fileStorage = _serviceProvider.GetRequiredService<Application.Interfaces.IFileStorageService>();
                    await MarketingBannerSeeder.SeedAsync(dbContext, fileStorage);
                    logger.LogInformation("Đã seed banner marketing demo cho môi trường Development.");
                }

                // Regenerate wwwroot/policy.csv cache từ DB (DB là truth, file là cache RAM) — chỉ 4 role chuẩn VaiTroNguoiDung.cs
                try
                {
                    var csvPath = Path.Combine(env.WebRootPath, "policy.csv");
                    var allLines = new List<string>();
                    var allowed = new HashSet<string>(new[] {
                        Domain.Enums.VaiTroNguoiDung.QUAN_TRI_VIEN.ToString(),
                        Domain.Enums.VaiTroNguoiDung.NGUOI_DAI_DIEN.ToString(),
                        Domain.Enums.VaiTroNguoiDung.NHAN_SU.ToString(),
                        Domain.Enums.VaiTroNguoiDung.UNG_VIEN.ToString()
                    });
                    var roles = await roleManager.Roles.Where(r => allowed.Contains(r.Name)).ToListAsync();
                    foreach (var role in roles)
                    {
                        var claims = await roleManager.GetClaimsAsync(role);
                        foreach (var claim in claims)
                        {
                            var actions = claim.Value.Split('#', StringSplitOptions.RemoveEmptyEntries);
                            foreach (var act in actions)
                                allLines.Add($"p, {role.Name}, {claim.Type}, {act}");
                        }
                    }
                    if (allLines.Count > 0)
                    {
                        allLines = allLines.Distinct().OrderBy(s => s).ToList();
                        var tmp = csvPath + ".tmp";
                        await File.WriteAllLinesAsync(tmp, allLines);
                        File.Move(tmp, csvPath, true);
                        // Reload Enforcer in-memory nếu đã tạo singleton
                        try
                        {
                            var enforcer = _serviceProvider.GetService<Enforcer>();
                            if (enforcer != null) await enforcer.LoadPolicyAsync();
                        }
                        catch { /* best-effort */ }
                        logger.LogInformation("Đã đồng bộ policy.csv cache từ DB: {Count} dòng", allLines.Count);
                    }
                }
                catch (Exception syncEx)
                {
                    logger.LogWarning(syncEx, "Không đồng bộ được policy.csv cache");
                }

                logger.LogInformation("Đã hoàn thành bơm dữ liệu mặc định!");
                logger.LogInformation("Ứng dụng đang khởi chạy ...");
            }
            catch (Exception ex)
            {
                // Không log connection string / secret: ex.Message của EF/Npgsql không chứa credentials.
                logger.LogError(ex, "Khởi tạo database/seed thất bại.");
                if (env.IsProduction())
                {
                    // Production: fail-fast để orchestrator (Render) báo deploy lỗi
                    // thay vì chạy với database nửa vời.
                    throw new InvalidOperationException(
                        "Backend không thể khởi động do khởi tạo database thất bại. Xem log để biết chi tiết.", ex);
                }
                logger.LogWarning("Tiếp tục khởi động ở môi trường {Environment} dù khởi tạo database thất bại.", env.EnvironmentName);
            }
        }
    }
}
