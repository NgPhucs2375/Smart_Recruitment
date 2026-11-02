using Application.Exceptions;
using Domain.Entities;
using Infrastructure.Persistence.Contexts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using WebApp.Server.Services;

namespace WebApp.Server.Hubs;

[Authorize]
public sealed class ChatHub(ApplicationDbContext db, ChatAccessService access, ChatConnectionRegistry registry) : Hub
{
    public static string CompanyGroup(int companyId) => $"company-chat:{companyId}";

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
        try
        {
            // Mọi kết nối chat hợp lệ vào nhóm công ty để nhận tín hiệu
            // "có hội thoại thay đổi" (không kèm nội dung tin nhắn).
            var actor = await access.RequireActorAsync(Context.User, "show");
            await Groups.AddToGroupAsync(Context.ConnectionId, CompanyGroup(actor.CompanyId));
        }
        catch (ApiException)
        {
            // Kết nối không đủ quyền chat: vẫn giữ hub sống để client nhận
            // lỗi rõ ràng khi gọi JoinConversation/SendMessage.
        }
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        registry.Remove(Context.ConnectionId);
        return base.OnDisconnectedAsync(exception);
    }

    public async Task JoinConversation(int conversationId)
    {
        try
        {
            var actor = await access.RequireActorAsync(Context.User, "show");
            await access.RequireConversationAsync(actor, conversationId);
            registry.Join(Context.ConnectionId, Context.User!, conversationId);
        }
        catch (ApiException ex) { throw new HubException(ex.Message); }
    }

    public Task LeaveConversation(int conversationId)
    {
        registry.Leave(Context.ConnectionId, conversationId);
        return Task.CompletedTask;
    }

    public async Task<Message> SendMessage(int conversationId, string content)
    {
        try
        {
            var actor = await access.RequireActorAsync(Context.User, "send");
            var conversation = await access.RequireConversationAsync(actor, conversationId);
            if (string.IsNullOrWhiteSpace(content) || content.Trim().Length > 4000)
                throw new HubException("Tin nhắn phải từ 1 đến 4.000 ký tự.");
            var message = new Message { ConversationId = conversationId.ToString(), SenderId = actor.Id.ToString(), Content = content.Trim() };
            conversation.LastModified = DateTime.UtcNow;
            db.Messages.Add(message);
            await db.SaveChangesAsync();

            // Báo cho danh sách hội thoại của cả công ty cập nhật thứ tự/tin mới
            // nhất. Chỉ gửi id, người nhận vẫn phải gọi API để đọc nội dung.
            await Clients.Group(CompanyGroup(actor.CompanyId))
                .SendAsync("ConversationUpdated", conversationId);
            // A previously joined group is not a grant. Revalidate every receiver
            // so removed employees/revoked sessions cannot receive future messages.
            foreach (var subscription in registry.ForConversation(conversationId))
            {
                try
                {
                    var recipient = await access.RequireActorAsync(subscription.User, "show");
                    await access.RequireConversationAsync(recipient, conversationId);
                }
                catch (ApiException)
                {
                    registry.Remove(subscription.ConnectionId);
                    await Clients.Client(subscription.ConnectionId).SendAsync("AccessRevoked", conversationId);
                    continue;
                }
                await Clients.Client(subscription.ConnectionId).SendAsync("MessageReceived", message);
            }
            return message;
        }
        catch (ApiException ex) { throw new HubException(ex.Message); }
    }
}
