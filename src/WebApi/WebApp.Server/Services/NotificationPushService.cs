using Application.DTOs.ThongBao;
using Application.Interfaces;
using Microsoft.AspNetCore.SignalR;
using WebApp.Server.Hubs;

namespace WebApp.Server.Services;

/// <summary>
/// Đẩy realtime thông báo tới group user:{NguoiDungId} của SignalR.
/// Hub tự join group này trong OnConnectedAsync.
/// </summary>
public class NotificationPushService : INotificationPushService
{
    private readonly IHubContext<NotificationsHub, INotificationClient> _hub;

    public NotificationPushService(IHubContext<NotificationsHub, INotificationClient> hub)
    {
        _hub = hub;
    }

    public Task PushToUserAsync(
        int nguoiDungId,
        ThongBaoDTO payload,
        CancellationToken cancellationToken = default)
    {
        if (nguoiDungId <= 0)
        {
            return Task.CompletedTask;
        }

        payload.NgayTao = DateTime.UtcNow;

        return _hub.Clients
            .Group($"user:{nguoiDungId}")
            .ReceiveNotification(payload);
    }
}
