using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Identity.Contexts;
using Infrastructure.Identity.Models;
using Infrastructure.Persistence.Contexts;
using Casbin;
using Serilog;

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
            //Read Configuration from appSettings
            var config = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .Build();
            //Initialize Logger
            Log.Logger = new LoggerConfiguration()
                .ReadFrom.Configuration(config)
                .CreateLogger();
            try
            {
                var dbContext = _serviceProvider.GetRequiredService<ApplicationDbContext>();
                dbContext.Database.Migrate();
                var identityDbContext = _serviceProvider.GetRequiredService<IdentityContext>();
                identityDbContext.Database.Migrate();

                var userManager = _serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
                var roleManager = _serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
                var appContext = _serviceProvider.GetRequiredService<Application.Interfaces.IApplicationDbContext>();
                var env = _serviceProvider.GetRequiredService<IWebHostEnvironment>();

                await Infrastructure.Identity.Seeds.DefaultRoles.SeedAsync(userManager, roleManager, env.WebRootPath);
                await Infrastructure.Identity.Seeds.DefaultSuperAdmin.SeedAsync(userManager, roleManager, appContext);
                await Infrastructure.Identity.Seeds.DefaultBasicUser.SeedAsync(userManager, roleManager, appContext);

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
                        Log.Information("Đã đồng bộ policy.csv cache từ DB: {Count} dòng", allLines.Count);
                    }
                }
                catch (Exception syncEx)
                {
                    Log.Warning(syncEx, "Không đồng bộ được policy.csv cache");
                }

                Log.Information("Đã hoàn thành bơm dữ liệu mặc định!");
                Log.Information("Ứng dụng đang khởi chạy ...");
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "Đã xảy ra lỗi khi thêm dữ liệu vào cơ sở dữ liệu!!!");
            }
            finally
            {
                Log.CloseAndFlush();
            }
        }
    }
}
