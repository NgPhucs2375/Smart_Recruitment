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
    public override async Task OnConnectedAsync()
    {
        try { await access.RequireActorAsync(Context.User, "show"); }
        catch (ApiException) { Context.Abort(); return; }
        await base.OnConnectedAsync();
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
            await access.RequireConversationAsync(actor, conversationId);
            if (string.IsNullOrWhiteSpace(content) || content.Trim().Length > 4000)
                throw new HubException("Tin nhắn phải từ 1 đến 4.000 ký tự.");
            var message = new Message { ConversationId = conversationId.ToString(), SenderId = actor.Id.ToString(), Content = content.Trim() };
            db.Messages.Add(message);
            await db.SaveChangesAsync();
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
