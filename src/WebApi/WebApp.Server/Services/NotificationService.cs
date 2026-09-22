using Application.DTOs.ThongBao;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Domain.Entities;
using Domain.Enums;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using WebApp.Server.Hubs;

namespace WebApp.Server.Services;

public class NotificationService : INotificationService
{
    private readonly IApplicationDbContext _context;
    private readonly IHubContext<NotificationsHub, INotificationClient> _hub;

    public NotificationService(
        IApplicationDbContext context,
        IHubContext<NotificationsHub, INotificationClient> hub)
    {
        _context = context;
        _hub = hub;
    }

    public Task SendToUserAsync(int userId, ThongBaoDTO notification)
    {
        return DispatchAsync(notification, new[] { userId }, $"user:{userId}");
    }

    public async Task SendToCompanyAsync(int companyId, ThongBaoDTO notification)
    {
        var userIds = await _context.HoSoNhaTuyenDungs
            .Where(x => x.DoanhNghiepId == companyId)
            .Select(x => x.NguoiDungId)
            .Union(
                _context.DoanhNghieps
                    .Where(x => x.Id == companyId && x.NguoiDaiDienId.HasValue)
                    .Select(x => x.NguoiDaiDienId!.Value))
            .Distinct()
            .ToListAsync();

        await DispatchAsync(notification, userIds, $"company:{companyId}");
    }

    public async Task SendToRoleAsync(string role, ThongBaoDTO notification)
    {
        if (!Enum.TryParse<VaiTroNguoiDung>(role, true, out var parsedRole))
            throw new ArgumentException($"Vai trò không hợp lệ: {role}", nameof(role));

        var userIds = await _context.NguoiDungs
            .Where(x => x.VaiTro == parsedRole && x.IsActive)
            .Select(x => x.Id)
            .ToListAsync();

        await DispatchAsync(notification, userIds, $"role:{parsedRole}");
    }

    private async Task DispatchAsync(
        ThongBaoDTO notification,
        IEnumerable<int> userIds,
        string groupName)
    {
        var recipients = userIds.Distinct().ToArray();
        if (recipients.Length == 0)
            return;

        var entity = new Notification
        {
            TieuDe = notification.TieuDe,
            NoiDung = notification.NoiDung,
            LoaiThongBao = notification.LoaiThongBao,
            ReferenceType = notification.ReferenceType,
            ReferenceId = notification.ReferenceId,
            Recipients = recipients.Select(userId => new NotificationRecipient
            {
                NguoiDungId = userId,
                IsRead = false
            }).ToList()
        };

        _context.Notifications.Add(entity);
        await _context.SaveChangesAsync();

        var payload = new ThongBaoDTO
        {
            Id = entity.Id,
            TieuDe = entity.TieuDe,
            NoiDung = entity.NoiDung,
            LoaiThongBao = entity.LoaiThongBao,
            IsRead = false,
            NgayTao = entity.Created,
            AudienceType = notification.AudienceType,
            NguoiDungId = recipients.Length == 1 ? recipients[0] : null,
            DoanhNghiepId = notification.DoanhNghiepId,
            Role = notification.Role,
            ReferenceType = entity.ReferenceType,
            ReferenceId = entity.ReferenceId
        };

        await _hub.Clients.Group(groupName).ReceiveNotification(payload);
    }
}
