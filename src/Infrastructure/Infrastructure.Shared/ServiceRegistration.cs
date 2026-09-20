using System;
using System.Collections.Generic;
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
                    ?? throw new InvalidOperationException(
                        "Thiếu cấu hình object storage. Khai báo section Minio " +
                        "(env Minio__Endpoint/Minio__AccessKey/Minio__SecretKey/Minio__BucketName).");

                var missing = new List<string>();
                if (string.IsNullOrWhiteSpace(settings.Endpoint)) missing.Add("Minio:Endpoint");
                if (string.IsNullOrWhiteSpace(settings.BucketName)) missing.Add("Minio:BucketName");
                if (string.IsNullOrWhiteSpace(settings.AccessKey)) missing.Add("Minio:AccessKey");
                if (string.IsNullOrWhiteSpace(settings.SecretKey)) missing.Add("Minio:SecretKey");
                if (missing.Count > 0)
                    throw new InvalidOperationException(
                        $"Thiếu cấu hình object storage: {string.Join(", ", missing)}. " +
                        "Khai báo đầy đủ các biến Minio__* trước khi dùng tính năng file.");

                // Production: endpoint localhost đồng nghĩa presigned URL sai và backend
                // không tới được storage thật — báo rõ thay vì âm thầm fallback.
                var isProduction = string.Equals(
                    Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                    "Production", StringComparison.OrdinalIgnoreCase);
                if (isProduction)
                {
                    if (IsLocalEndpoint(settings.Endpoint))
                        throw new InvalidOperationException(
                            "Minio:Endpoint đang trỏ localhost trong Production. " +
                            "Trỏ Minio__Endpoint tới object storage truy cập được từ Render.");
                    if (string.IsNullOrWhiteSpace(settings.PublicEndpoint))
                        throw new InvalidOperationException(
                            "Minio:PublicEndpoint is required in Production để tạo presigned URL cho trình duyệt. " +
                            "Set Minio__PublicEndpoint (HTTPS, public).");
                    if (IsLocalEndpoint(settings.PublicEndpoint))
                        throw new InvalidOperationException(
                            "Minio:PublicEndpoint đang trỏ localhost trong Production — " +
                            "trình duyệt không tải được presigned URL. Set URL HTTPS public.");
                }

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

        private static bool IsLocalEndpoint(string endpoint)
        {
            var host = endpoint.Trim().Split(':')[0].Trim().ToLowerInvariant();
            return host is "localhost" or "127.0.0.1" or "::1" or "0.0.0.0";
        }
    }
}
