using Application.DTOs.ThongBao;

namespace Application.Interfaces;

/// <summary>
/// Đẩy realtime 1 thông báo tới group SignalR của người dùng.
/// Chỉ push — việc lưu DB do caller (workflow service) đảm nhiệm để giữ
/// nguyên cơ chế commit chung 1 transaction của caller.
/// Frontend nhận event "ReceiveNotification" rồi tự refetch danh sách.
/// </summary>
public interface INotificationPushService
{
    Task PushToUserAsync(
        int nguoiDungId,
        ThongBaoDTO payload,
        CancellationToken cancellationToken = default);
}
