using Application.Interfaces;
using Application.Interfaces.Repositories;
using WebApp.Server.Health;
using WebApp.Server.Services;

namespace WebApp.Server.Extensions;

public static class WebAppServiceExtensions
{
    // Gom các service dùng riêng của WebApp.Server để Program.cs chỉ còn gọi một dòng.
    public static IServiceCollection AddWebAppServices(this IServiceCollection services)
    {
        services.AddHttpClient<AiProviderHealthCheck>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(5);
        });
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<INotificationPushService, NotificationPushService>();
        services.AddScoped<IAuthenticatedUserService, AuthenticatedUserService>();
        services.AddScoped<ICurrentNguoiDungService, CurrentNguoiDungService>();
        return services;
    }
}
