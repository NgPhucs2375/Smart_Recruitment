using Application.Exceptions;
using Application.Wrappers;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence.Contexts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Server.Services;

namespace WebApp.Server.Controllers.v1;

[ApiController]
[Authorize]
[Route("api/chat")]
public sealed class ChatController(ApplicationDbContext db, ChatAccessService access) : ControllerBase
{
    [HttpGet("context")]
    public async Task<IActionResult> GetContext()
    {
        var actor = await access.RequireActorAsync(User, "list");
        return Ok(new Response<object>(new { CurrentUserId = actor.Id, CompanyId = actor.CompanyId,
            CanCreate = await AllowedAsync("create"), CanSend = await AllowedAsync("send") }));
    }

    private async Task<bool> AllowedAsync(string action)
    {
        try { await access.RequireActorAsync(User, action); return true; }
        catch (ApiException) { return false; }
    }

    [HttpGet("contacts")]
    public async Task<IActionResult> GetContacts()
    {
        var actor = await access.RequireActorAsync(User, "list");
        return Ok(new Response<List<ChatContact>>(await access.ContactsAsync(actor)));
    }

    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
    {
        var actor = await access.RequireActorAsync(User, "list");
        return Ok(new Response<List<ChatConversation>>(await access.ConversationsAsync(actor)));
    }

    [HttpPost("conversations")]
    public async Task<IActionResult> CreateConversation(CreateConversationRequest request)
    {
        var actor = await access.RequireActorAsync(User, "create");
        if (!Enum.IsDefined(request.Type)) return BadRequest(new Response<object>("Loại hội thoại không hợp lệ."));
        var conversation = new Conversation { DoanhNghiepId = actor.CompanyId.ToString(), Type = request.Type };
        if (request.Type == TypeConversation.Direct)
        {
            var contact = (await access.ContactsAsync(actor)).SingleOrDefault(c => c.Id == request.RecipientId);
            if (contact is null) return NotFound(); // Includes self, inactive users and other companies.
            conversation.ParticipantOneId = Math.Min(actor.Id, contact.Id);
            conversation.ParticipantTwoId = Math.Max(actor.Id, contact.Id);
            conversation.Title = "Trao đổi riêng";
            var existing = await FindDirectAsync(conversation);
            if (existing is not null) return ConversationResponse(existing, actor, contact.Name);
            db.Conversations.Add(conversation);
            try { await db.SaveChangesAsync(); }
            catch (DbUpdateException)
            {
                db.Entry(conversation).State = EntityState.Detached;
                existing = await FindDirectAsync(conversation);
                if (existing is null) throw;
                return ConversationResponse(existing, actor, contact.Name);
            }
            return ConversationResponse(conversation, actor, contact.Name);
        }
        if (request.RecipientId.HasValue) return BadRequest(new Response<object>("Phòng chung không có người nhận riêng."));
        var title = request.Title?.Trim();
        if (string.IsNullOrWhiteSpace(title) || title.Length > 120)
            return BadRequest(new Response<object>("Tên phòng chung phải từ 1 đến 120 ký tự."));
        conversation.Title = title;
        db.Conversations.Add(conversation);
        await db.SaveChangesAsync();
        return ConversationResponse(conversation, actor, title);
    }

    private Task<Conversation?> FindDirectAsync(Conversation c) => db.Conversations.SingleOrDefaultAsync(x =>
        x.Type == TypeConversation.Direct && x.DoanhNghiepId == c.DoanhNghiepId
        && x.ParticipantOneId == c.ParticipantOneId && x.ParticipantTwoId == c.ParticipantTwoId);

    private IActionResult ConversationResponse(Conversation c, ChatActor actor, string title) =>
        Ok(new Response<ChatConversation>(new ChatConversation(c.Id, title, c.Type, ChatAccessService.Other(c, actor))));

    [HttpGet("conversations/{conversationId:int}/messages")]
    public async Task<IActionResult> GetMessages(int conversationId, [FromQuery] int take = 100, [FromQuery] int? beforeId = null)
    {
        var actor = await access.RequireActorAsync(User, "show");
        await access.RequireConversationAsync(actor, conversationId);
        var messages = await db.Messages.Where(m => m.ConversationId == conversationId.ToString() && !m.IsDeleted
            && (!beforeId.HasValue || m.Id < beforeId.Value))
            .OrderByDescending(m => m.Id).Take(Math.Clamp(take, 1, 200)).ToListAsync();
        messages.Reverse();
        return Ok(new Response<List<Message>>(messages));
    }
}

public sealed record CreateConversationRequest(string? Title = null, TypeConversation Type = TypeConversation.Group, int? RecipientId = null);
