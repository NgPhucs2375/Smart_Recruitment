using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using Application.Interfaces;
using Infrastructure.Identity.Contexts;
using Infrastructure.Shared.Services;

namespace Infrastructure.Identity.Contexts
{
    public class IdentityDbContextFactory : IDesignTimeDbContextFactory<IdentityContext>
            {
                public IdentityContext CreateDbContext(string[] args)
                {
                    var baseDir = FindAppSettingsDirectory();
                    var config = new ConfigurationBuilder()
                        .SetBasePath(baseDir)
                        .AddJsonFile("appsettings.json", optional: true)
                        .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development"}.json", optional: true)
                        .Build();
                    var conn = config.GetConnectionString("PostgresConnection");
                    if (string.IsNullOrEmpty(conn))
                    {
                        throw new InvalidOperationException(
                            $"Connection string 'PostgresConnection' not found. Searched base directory: {baseDir}");
                    }

                    // 2. Dựng options UseNpgsql bằng tay
                    var options = new DbContextOptionsBuilder<IdentityContext>()
                        .UseNpgsql(conn, b => b.MigrationsAssembly(typeof(IdentityContext).Assembly.FullName))
                        .Options;

                    // 3. Trả về context (cần cấp 2 dependency phụ)
                    return new IdentityContext(options);
                }

                private static string FindAppSettingsDirectory()
                {
                    var candidates = new[]
                    {
                        Directory.GetCurrentDirectory(),
                        AppContext.BaseDirectory,
                        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, @"..\..\..\..\..\..\WebApi\WebApp.Server"))
                    };

                    foreach (var start in candidates)
                    {
                        var dir = new DirectoryInfo(start);
                        while (dir != null && dir.Exists)
                        {
                            if (File.Exists(Path.Combine(dir.FullName, "appsettings.json")))
                            {
                                return dir.FullName;
                            }
                            dir = dir.Parent;
                        }
                    }

                    return candidates[0];
                }
            
            }
}