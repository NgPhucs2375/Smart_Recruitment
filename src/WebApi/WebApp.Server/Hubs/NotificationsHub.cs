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
            try
            {
                var ctx = await _currentNguoiDung.ResolveAsync();
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{ctx.Id}");
            }
            catch
            {
                // Fallback: NguoiDung chưa tồn tại (user mới) — dùng uid làm group để không đóng connection
                var uid = _auth.UserId;
                if (!string.IsNullOrWhiteSpace(uid))
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{uid}");
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            try
            {
                var ctx = await _currentNguoiDung.ResolveAsync();
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{ctx.Id}");
            }
            catch
            {
                var uid = _auth.UserId;
                if (!string.IsNullOrWhiteSpace(uid))
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{uid}");
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}
