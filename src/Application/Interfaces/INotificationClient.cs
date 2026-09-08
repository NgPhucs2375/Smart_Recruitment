using Application.DTOs.ThongBao;

namespace Application.Interfaces;

public interface INotificationClient
{
    Task ReceiveNotification(ThongBaoDTO notification);
    Task UpdateUnreadCount(int count);
}
