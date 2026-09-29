using Application.Interfaces;
using Application.Interfaces.Repositories;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace WebApp.Server.Hubs;

[Authorize]
public sealed class ChatHub : Hub
{
    private readonly IConversationRepositoryAsync _conversations;
    private readonly IMessageRepositoryAsync _messages;
    private readonly ICurrentNguoiDungService _currentUser;

    public ChatHub(
        IConversationRepositoryAsync conversations,
        IMessageRepositoryAsync messages,
        ICurrentNguoiDungService currentUser)
    {
        _conversations = conversations;
        _messages = messages;
        _currentUser = currentUser;
    }

    public async Task JoinConversation(int conversationId)
    {
        var conversation = await GetAuthorizedConversation(conversationId);
        if (conversation is null) throw new HubException("Bạn không có quyền truy cập hội thoại này.");
        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(conversationId));
    }

    public async Task LeaveConversation(int conversationId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(conversationId));
    }

    public async Task<Message> SendMessage(int conversationId, string content)
    {
        var conversation = await GetAuthorizedConversation(conversationId);
        if (conversation is null) throw new HubException("Bạn không có quyền truy cập hội thoại này.");
        if (string.IsNullOrWhiteSpace(content)) throw new HubException("Nội dung tin nhắn không được để trống.");

        var current = await _currentUser.ResolveAsync();
        var message = await _messages.AddAsync(new Message
        {
            ConversationId = conversationId.ToString(),
            SenderId = current.Id.ToString(),
            Content = content.Trim()
        });

        await Clients.Group(GroupName(conversationId)).SendAsync("MessageReceived", message);
        return message;
    }

    private async Task<Conversation?> GetAuthorizedConversation(int id)
    {
        var current = await _currentUser.ResolveAsync();
        return current.DoanhNghiepId.HasValue
            ? await _conversations.GetForCompanyAsync(id, current.DoanhNghiepId.Value.ToString())
            : null;
    }

    private static string GroupName(int conversationId) => $"conversation:{conversationId}";
}
