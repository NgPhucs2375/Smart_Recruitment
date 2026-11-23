namespace WebApp.Server.Agent.Notifications;

// Dùng chung cho cả agent ứng viên và nhà tuyển dụng: cùng một shape,
// khác nhau chỉ ở NguoiDungId đang đăng nhập.
public sealed class AgentNotificationsResult
{
    public int UnreadCount { get; set; }
    public int TotalCount { get; set; }
    public bool UnreadOnly { get; set; }
    public List<AgentNotificationItem> Items { get; set; } = new();
}

public sealed class AgentNotificationItem
{
    public int Id { get; set; }
    public string TieuDe { get; set; } = "";
    public string? NoiDung { get; set; }
    public string Loai { get; set; } = "";
    public bool DaDoc { get; set; }
    public DateTime TaoLuc { get; set; }
    public string? ReferenceType { get; set; }
    public int? ReferenceId { get; set; }
    public int? TinTuyenDungId { get; set; }
}
