using System.Runtime.CompilerServices;
using System.Text.Json;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using Domain.Enums;
using WebApp.Server.Agent.RecommenAdam.Candidate;
using WebApp.Server.Agent.RecommenAdam.Recruiter;
using Microsoft.Extensions.Logging;

namespace WebApp.Server.Agent.RecommenAdam;

internal sealed class ScopedRecommenAdamAgent : AIAgent
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<ScopedRecommenAdamAgent> _logger;

    public ScopedRecommenAdamAgent(
        IHttpContextAccessor httpContextAccessor,
        ILogger<ScopedRecommenAdamAgent> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public override string? Name => "Adam";
    public override string? Description => "Trợ lý chuyên biệt theo vai trò ứng viên hoặc tuyển dụng.";

    protected override async Task<AgentResponse> RunCoreAsync(IEnumerable<ChatMessage> messages, AgentSession? session = null, AgentRunOptions? options = null, CancellationToken cancellationToken = default)
        => await (await ResolveAgentAsync()).RunAsync(messages, session, options, cancellationToken);

    protected override async IAsyncEnumerable<AgentResponseUpdate> RunCoreStreamingAsync(IEnumerable<ChatMessage> messages, AgentSession? session = null, AgentRunOptions? options = null, [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var agent = await ResolveAgentAsync();
        await foreach (var update in agent.RunStreamingAsync(messages, session, options, cancellationToken).ConfigureAwait(false))
            yield return update;
    }

    protected override async ValueTask<AgentSession> CreateSessionCoreAsync(CancellationToken cancellationToken = default)
        => await (await ResolveAgentAsync()).CreateSessionAsync(cancellationToken);

    protected override async ValueTask<JsonElement> SerializeSessionCoreAsync(AgentSession session, JsonSerializerOptions? jsonSerializerOptions = null, CancellationToken cancellationToken = default)
        => await (await ResolveAgentAsync()).SerializeSessionAsync(session, jsonSerializerOptions, cancellationToken);

    protected override async ValueTask<AgentSession> DeserializeSessionCoreAsync(JsonElement serializedState, JsonSerializerOptions? jsonSerializerOptions = null, CancellationToken cancellationToken = default)
        => await (await ResolveAgentAsync()).DeserializeSessionAsync(serializedState, jsonSerializerOptions, cancellationToken);

    private async Task<AIAgent> ResolveAgentAsync()
    {
        var services = _httpContextAccessor.HttpContext?.RequestServices
            ?? throw new InvalidOperationException("Không có HTTP request scope hiện tại.");
        var current = await services.GetRequiredService<Application.Interfaces.ICurrentNguoiDungService>().ResolveAsync();
        _logger.LogInformation("Adam agent role routing. Role={Role}", current.VaiTro);
        return current.VaiTro == VaiTroNguoiDung.UNG_VIEN
            ? services.GetRequiredService<CandidateAdamAgentFactory>().CreateAgent()
            : services.GetRequiredService<RecruiterAdamAgentFactory>().CreateAgent();
    }
}
