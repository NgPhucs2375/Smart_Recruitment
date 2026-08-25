using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Identity.Contexts;
using Infrastructure.Identity.Models;
using Infrastructure.Persistence.Contexts;
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

                await Infrastructure.Identity.Seeds.DefaultRoles.SeedAsync(userManager, roleManager);
                await Infrastructure.Identity.Seeds.DefaultSuperAdmin.SeedAsync(userManager, roleManager, appContext);
                await Infrastructure.Identity.Seeds.DefaultBasicUser.SeedAsync(userManager, roleManager, appContext);
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
