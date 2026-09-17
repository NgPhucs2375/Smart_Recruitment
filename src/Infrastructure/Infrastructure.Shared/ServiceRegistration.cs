using System;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Application.Interfaces;
using Domain.Settings;
using Domain.Settingss;
using Infrastructure.Shared.Services;
using Minio;

namespace Infrastructure.Shared
{
    public static class ServiceRegistration
    {
        public static void AddSharedInfrastructure(this IServiceCollection services, IConfiguration _config)
        {
            services.Configure<MailSettings>(_config.GetSection("MailSettings"));
            services.Configure<MinioSettings>(_config.GetSection("Minio"));
            services.AddSingleton<IMinioClient>(_ =>
            {
                var settings = _config.GetSection("Minio").Get<MinioSettings>()
                    ?? throw new InvalidOperationException("Thiếu cấu hình Minio.");
                return new MinioClient()
                    .WithEndpoint(settings.Endpoint)
                    .WithCredentials(settings.AccessKey, settings.SecretKey)
                    .WithSSL(settings.UseSSL)
                    .Build();
            });
            services.AddScoped<IFileStorageService, MinioFileStorageService>();
            services.AddTransient<IDateTimeService, DateTimeService>();
            services.AddTransient<IEmailService, EmailService>();
            services.AddHttpClient<ICvStructuredParser, GeminiCvStructuredParser>(client =>
            {
                client.BaseAddress = new Uri("https://generativelanguage.googleapis.com/");
                client.Timeout = TimeSpan.FromSeconds(90);
            });
        }
    }
}
