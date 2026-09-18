using System.Runtime.CompilerServices;
using System.Text.Json;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;

namespace WebApp.Server.Agent.CvAssistant;

// MapAGUIServer hiện resolve agent khi map endpoint. Router singleton này trì hoãn
// việc tạo agent đến request để scoped tools không bị giữ bởi root service provider.
internal sealed class ScopedCvAssistantAgent : AIAgent
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ScopedCvAssistantAgent(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public override string? Name => CvAssistantInstructions.AgentName;

    public override string? Description => "Trợ lý tư vấn và xây dựng CV.";

    protected override Task<AgentResponse> RunCoreAsync(
        IEnumerable<ChatMessage> messages,
        AgentSession? session = null,
        AgentRunOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        return ResolveAgent().RunAsync(messages, session, options, cancellationToken);
    }

    protected override async IAsyncEnumerable<AgentResponseUpdate> RunCoreStreamingAsync(
        IEnumerable<ChatMessage> messages,
        AgentSession? session = null,
        AgentRunOptions? options = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        await foreach (var update in ResolveAgent()
            .RunStreamingAsync(messages, session, options, cancellationToken)
            .ConfigureAwait(false))
        {
            yield return update;
        }
    }

    protected override ValueTask<AgentSession> CreateSessionCoreAsync(
        CancellationToken cancellationToken = default)
        => ResolveAgent().CreateSessionAsync(cancellationToken);

    protected override ValueTask<JsonElement> SerializeSessionCoreAsync(
        AgentSession session,
        JsonSerializerOptions? jsonSerializerOptions = null,
        CancellationToken cancellationToken = default)
        => ResolveAgent().SerializeSessionAsync(session, jsonSerializerOptions, cancellationToken);

    protected override ValueTask<AgentSession> DeserializeSessionCoreAsync(
        JsonElement serializedState,
        JsonSerializerOptions? jsonSerializerOptions = null,
        CancellationToken cancellationToken = default)
        => ResolveAgent().DeserializeSessionAsync(serializedState, jsonSerializerOptions, cancellationToken);

    private AIAgent ResolveAgent()
    {
        var requestServices = _httpContextAccessor.HttpContext?.RequestServices
            ?? throw new InvalidOperationException("Không có HTTP request scope hiện tại.");
        return requestServices.GetRequiredService<CvAssistantAgentFactory>().CreateAgent();
    }
}
