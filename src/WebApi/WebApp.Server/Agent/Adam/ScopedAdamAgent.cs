using System.Runtime.CompilerServices;
using System.Text.Json;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;

namespace WebApp.Server.Agent.Adam;

internal sealed class ScopedAdamAgent : AIAgent
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ScopedAdamAgent(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public override string? Name => AdamInstructions.AgentName;
    public override string? Description => "Trợ lý global về CV và hồ sơ ứng viên.";

    protected override Task<AgentResponse> RunCoreAsync(IEnumerable<ChatMessage> messages, AgentSession? session = null, AgentRunOptions? options = null, CancellationToken cancellationToken = default)
        => ResolveAgent().RunAsync(messages, session, options, cancellationToken);

    protected override async IAsyncEnumerable<AgentResponseUpdate> RunCoreStreamingAsync(IEnumerable<ChatMessage> messages, AgentSession? session = null, AgentRunOptions? options = null, [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        await foreach (var update in ResolveAgent().RunStreamingAsync(messages, session, options, cancellationToken).ConfigureAwait(false))
            yield return update;
    }

    protected override ValueTask<AgentSession> CreateSessionCoreAsync(CancellationToken cancellationToken = default)
        => ResolveAgent().CreateSessionAsync(cancellationToken);

    protected override ValueTask<JsonElement> SerializeSessionCoreAsync(AgentSession session, JsonSerializerOptions? jsonSerializerOptions = null, CancellationToken cancellationToken = default)
        => ResolveAgent().SerializeSessionAsync(session, jsonSerializerOptions, cancellationToken);

    protected override ValueTask<AgentSession> DeserializeSessionCoreAsync(JsonElement serializedState, JsonSerializerOptions? jsonSerializerOptions = null, CancellationToken cancellationToken = default)
        => ResolveAgent().DeserializeSessionAsync(serializedState, jsonSerializerOptions, cancellationToken);

    private AIAgent ResolveAgent()
    {
        var services = _httpContextAccessor.HttpContext?.RequestServices
            ?? throw new InvalidOperationException("Không có HTTP request scope hiện tại.");
        return services.GetRequiredService<AdamAgentFactory>().CreateAgent();
    }
}
