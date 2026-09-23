using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Infrastructure.Persistence.Contexts;
using Infrastructure.Persistence.Repository;
using Pgvector.EntityFrameworkCore;
using System;

namespace Infrastructure.Persistence
{
    public static class ServiceRegistration
    {
        public static void AddInMemoryDatabase(this IServiceCollection services)
        {
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("ApplicationDb"));
        }
    
        public static void AddNpgSqlPersistenceInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            // Config first, raw env var as backward-compatible fallback.
            // Fail fast here instead of silently skipping AddDbContext.
            var appConnStr = configuration.GetConnectionString("PostgresConnection");
            if (string.IsNullOrWhiteSpace(appConnStr))
            {
                appConnStr = Environment.GetEnvironmentVariable("POSTGRES_CONNECTION_STRING");
            }
            if (string.IsNullOrWhiteSpace(appConnStr))
            {
                throw new InvalidOperationException(
                    "PostgreSQL connection string is missing. Set ConnectionStrings:PostgresConnection " +
                    "(or the POSTGRES_CONNECTION_STRING environment variable) before starting the application.");
            }
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseNpgsql(
                appConnStr,
                b =>
                {
                    b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
                    b.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
                    b.UseVector();
                }));
        }

        public static void AddPersistenceRepositories(this IServiceCollection services)
        {
            #region Repositories
            services.AddTransient(typeof(IGenericRepositoryAsync<>), typeof(GenericRepositoryAsync<>));
            services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());
            // services.AddScoped<IHoSoUngVienRepositoryAsync, HoSoUngVienRepositoryAsync>();
            #endregion
        }
    }
}
