using Application.Interfaces;
using Application.Interfaces.Repositories;
using Application.Wrappers;
using Domain.Entities;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/chat")]
    public sealed class ChatController : ControllerBase
    {
        private readonly IConversationRepositoryAsync _conversations;
        private readonly IMessageRepositoryAsync _messages;
        private readonly ICurrentNguoiDungService _currentUser;

        public ChatController(
            IConversationRepositoryAsync conversations,
            IMessageRepositoryAsync messages,
            ICurrentNguoiDungService currentUser)
        {
            _conversations = conversations;
            _messages = messages;
            _currentUser = currentUser;
        }

        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            var current = await _currentUser.ResolveAsync();
            if (!current.DoanhNghiepId.HasValue) return Ok(new Response<IReadOnlyList<Conversation>>([]));

            return Ok(new Response<IReadOnlyList<Conversation>>(
                await _conversations.GetForCompanyAsync(current.DoanhNghiepId.Value.ToString())));
        }

        [HttpPost("conversations")]
        public async Task<IActionResult> CreateConversation([FromBody] CreateConversationRequest request)
        {
            var current = await _currentUser.ResolveAsync();
            if (!current.DoanhNghiepId.HasValue) return Forbid();
            if (string.IsNullOrWhiteSpace(request.Title)) return BadRequest(new Response<Conversation>("Tên hội thoại không được để trống."));

            var conversation = await _conversations.AddAsync(new Conversation
            {
                Title = request.Title.Trim(),
                Type = request.Type,
                DoanhNghiepId = current.DoanhNghiepId.Value.ToString()
            });
            return Ok(new Response<Conversation>(conversation));
        }

        [HttpGet("conversations/{conversationId:int}/messages")]
        public async Task<IActionResult> GetMessages(int conversationId, [FromQuery] int take = 100)
        {
            var current = await _currentUser.ResolveAsync();
            if (!current.DoanhNghiepId.HasValue) return Forbid();
            var companyId = current.DoanhNghiepId.Value.ToString();
            if (await _conversations.GetForCompanyAsync(conversationId, companyId) is null) return NotFound();

            var messages = await _messages.GetForConversationAsync(conversationId, companyId, take);
            return Ok(new Response<IReadOnlyList<Message>>(messages.Reverse().ToList()));
        }
    }

    public sealed record CreateConversationRequest(string Title, TypeConversation Type = TypeConversation.Group);
}
