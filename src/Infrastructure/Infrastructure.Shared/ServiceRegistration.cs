using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Application.Interfaces.Repositories;
using Application.Interfaces;
using Domain.Settings;
using Infrastructure.Shared.Services;
using Infrastructure.Shared.Services.Embedding;
using System;

namespace Infrastructure.Shared
{
    public static class ServiceRegistration
    {
        public static void AddSharedInfrastructure(this IServiceCollection services, IConfiguration _config)
        {
            services.Configure<MailSettings>(_config.GetSection("MailSettings"));
            services.AddTransient<IDateTimeService, DateTimeService>();
            services.AddTransient<IEmailService, EmailService>();
            services.AddHttpClient<IEmbeddingRepository, GeminiEmbeddingService>(client =>
            {
                client.BaseAddress = new Uri(
                    "https://generativelanguage.googleapis.com"
                );
            });
        }
    }
}
