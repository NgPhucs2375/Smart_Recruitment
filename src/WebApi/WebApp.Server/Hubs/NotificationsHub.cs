using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace WebApp.Server.Hubs
{
    [Authorize]
    public class NotificationsHub : Hub
    {
        private readonly IAuthenticatedUserService _auth;
        private readonly ICurrentNguoiDungService _currentNguoiDung;

        public NotificationsHub(
            IAuthenticatedUserService auth,
            ICurrentNguoiDungService currentNguoiDung)
        {
            _auth = auth;
            _currentNguoiDung = currentNguoiDung;
        }

        public override async Task OnConnectedAsync()
        {
            var ctx = await _currentNguoiDung.ResolveAsync();
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{ctx.Id}");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var ctx = await _currentNguoiDung.ResolveAsync();
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{ctx.Id}");
            await base.OnDisconnectedAsync(exception);
        }
    }
}
