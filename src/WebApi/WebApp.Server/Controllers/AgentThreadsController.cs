using System.Text.Json.Nodes;
using Application.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApp.Server.Agent.Threads;

namespace WebApp.Server.Controllers;

/// <summary>
/// Read API cho lịch sử hội thoại agent Adam (lưu ở Redis bởi AgentThreadHistoryMiddleware).
/// Mọi endpoint theo scope của user đang đăng nhập (userId nằm trong Redis key) —
/// không có endpoint đọc chéo user. Dùng cho: khôi phục chat khi reload trang,
/// audit kỹ thuật, và client fallback khi InMemoryAgentRunner mất data khi restart.
/// </summary>
[Authorize]
[ApiController]
[Route("api/agent/threads")]
public sealed class AgentThreadsController : ControllerBase
{
    private readonly AgentThreadStore _store;
    private readonly ILogger<AgentThreadsController> _logger;

    public AgentThreadsController(AgentThreadStore store, ILogger<AgentThreadsController> logger)
    {
        _store = store;
        _logger = logger;
    }

    /// <summary>Danh sách thread của user (mới nhất trước), không kèm messages/events.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(Response<List<AgentThreadSummary>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List([FromQuery] int limit = 50, CancellationToken cancellationToken = default)
    {
        var userId = await _store.CurrentUserIdAsync();
        if (userId is null) return Unauthorized(new Response<string>("Phiên đăng nhập không hợp lệ."));
        try
        {
            var threads = await _store.ListAsync(userId.Value, limit, cancellationToken);
            return Ok(new Response<List<AgentThreadSummary>>(threads.ToList()));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Không đọc được danh sách agent thread. UserId={UserId}", userId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new Response<string>("Không đọc được lịch sử chat, vui lòng thử lại."));
        }
    }

    /// <summary>Snapshot 1 thread: metadata + messages (đã merge).</summary>
    [HttpGet("{threadId}")]
    [ProducesResponseType(typeof(Response<AgentThreadSnapshot>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(string threadId, CancellationToken cancellationToken = default)
    {
        if (!AgentThreadStore.IsValidThreadId(threadId))
            return NotFound(new Response<string>("Không tìm thấy phiên chat."));

        var userId = await _store.CurrentUserIdAsync();
        if (userId is null) return Unauthorized(new Response<string>("Phiên đăng nhập không hợp lệ."));
        try
        {
            var snapshot = await _store.GetAsync(userId.Value, threadId, cancellationToken);
            return snapshot == null
                ? NotFound(new Response<string>("Không tìm thấy phiên chat."))
                : Ok(new Response<AgentThreadSnapshot>(snapshot));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Không đọc được agent thread. UserId={UserId}, ThreadId={ThreadId}", userId, threadId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new Response<string>("Không đọc được lịch sử chat, vui lòng thử lại."));
        }
    }

    /// <summary>
    /// Events AG-UI thô của mọi run trong thread (audit + replay).
    /// Trả raw JSON { events: [...] } với đúng tên field AG-UI (camelCase) —
    /// client runner dùng trực tiếp cho connect replay, không qua wrapper PascalCase.
    /// </summary>
    [HttpGet("{threadId}/events")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEvents(string threadId, CancellationToken cancellationToken = default)
    {
        if (!AgentThreadStore.IsValidThreadId(threadId))
            return NotFound(new { events = Array.Empty<object>() });

        var userId = await _store.CurrentUserIdAsync();
        if (userId is null) return Unauthorized(new Response<string>("Phiên đăng nhập không hợp lệ."));
        try
        {
            var events = await _store.GetEventsAsync(userId.Value, threadId, cancellationToken);
            var payload = new JsonObject { ["events"] = new JsonArray(events.Select(e => e.DeepClone()).ToArray()) };
            return Content(payload.ToJsonString(), "application/json; charset=utf-8");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Không đọc được agent thread events. UserId={UserId}, ThreadId={ThreadId}", userId, threadId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new Response<string>("Không đọc được lịch sử chat, vui lòng thử lại."));
        }
    }

    /// <summary>Xóa 1 thread (snapshot + run records + index entry).</summary>
    [HttpDelete("{threadId}")]
    [ProducesResponseType(typeof(ResponseBase), StatusCodes.Status200OK)]
    public async Task<IActionResult> Delete(string threadId, CancellationToken cancellationToken = default)
    {
        if (!AgentThreadStore.IsValidThreadId(threadId))
            return NotFound(new Response<string>("Không tìm thấy phiên chat."));

        var userId = await _store.CurrentUserIdAsync();
        if (userId is null) return Unauthorized(new Response<string>("Phiên đăng nhập không hợp lệ."));
        try
        {
            await _store.DeleteAsync(userId.Value, threadId, cancellationToken);
            return Ok(new ResponseBase { Succeeded = true, Message = "Đã xóa phiên chat." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Không xóa được agent thread. UserId={UserId}, ThreadId={ThreadId}", userId, threadId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new Response<string>("Không xóa được phiên chat, vui lòng thử lại."));
        }
    }
}
