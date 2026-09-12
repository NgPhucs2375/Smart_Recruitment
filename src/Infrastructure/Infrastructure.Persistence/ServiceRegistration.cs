using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Infrastructure.Persistence.Contexts;
using Infrastructure.Persistence.Repositories;
using Infrastructure.Persistence.Repository;
using Infrastructure.Shared.Environments;
using Application.Services.Retrieval;

namespace Infrastructure.Persistence
{
    public static class ServiceRegistration
    {
        public static void AddInMemoryDatabase(this IServiceCollection services)
        {
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("ApplicationDb"));
        }
    
        public static void AddNpgSqlPersistenceInfrastructure(this IServiceCollection services)
        {
            var sp = services.BuildServiceProvider();
            using (var scope = sp.CreateScope())
            {
                var _dbSetting = scope.ServiceProvider.GetRequiredService<IDatabaseSettingsProvider>();
                string appConnStr = _dbSetting.GetPostgresConnectionString();
                if (!string.IsNullOrWhiteSpace(appConnStr))
                {
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
            }
            sp.Dispose();
        }

        public static void AddPersistenceRepositories(this IServiceCollection services)
        {
            #region Repositories
            services.AddTransient(typeof(IGenericRepositoryAsync<>), typeof(GenericRepositoryAsync<>));
            services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());
            services.AddScoped<ICandidateSemanticSearchRepository, CandidateSemanticSearch>();
            services.AddScoped<ICvEmbeddingService, CvEmbeddingService>();
            services.AddScoped<
                ICvSemanticDocumentBuilder,
                CvSemanticDocumentBuilder>();

            services.AddScoped<
                ICvEmbeddingService,
                CvEmbeddingService>();
            // services.AddScoped<IHoSoUngVienRepositoryAsync, HoSoUngVienRepositoryAsync>();
            #endregion
        }
    }
}
