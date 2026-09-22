using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace WebApp.Server.Hubs;

[Authorize]
public class NotificationsHub : Hub<INotificationClient>
{
    private readonly ICurrentNguoiDungService _currentNguoiDung;

    public NotificationsHub(ICurrentNguoiDungService currentNguoiDung)
    {
        _currentNguoiDung = currentNguoiDung;
    }

    public override async Task OnConnectedAsync()
    {
        var currentUser = await _currentNguoiDung.ResolveAsync();

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            $"user:{currentUser.Id}");

        if (currentUser.DoanhNghiepId.HasValue)
        {
            await Groups.AddToGroupAsync(
                Context.ConnectionId,
                $"company:{currentUser.DoanhNghiepId.Value}");
        }

        var roles = Context.User?
            .FindAll(ClaimTypes.Role)
            .Select(x => x.Value)
            .Append(currentUser.VaiTro.ToString())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            ?? Enumerable.Empty<string>();

        foreach (var role in roles)
        {
            await Groups.AddToGroupAsync(
                Context.ConnectionId,
                $"role:{role.ToUpperInvariant()}");
        }

        await base.OnConnectedAsync();
    }
}
