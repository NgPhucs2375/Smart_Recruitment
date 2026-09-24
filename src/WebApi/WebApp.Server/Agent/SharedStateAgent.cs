using System.Runtime.CompilerServices;
using System.Text.Json;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;

namespace WebApp.Server.Agent.SharedState;

/// <summary>
/// AG-UI shared-state adapter following CopilotKit's official .NET pattern:
/// hydrate state from the incoming run, execute the inner agent, then publish
/// the authoritative backend snapshot as a DataContent update.
/// </summary>
internal sealed class SharedStateAgent : DelegatingAIAgent
{
    private const string StateOptionKey = "ag_ui_state";
    private readonly SharedStateStore _store;
    private readonly ILogger<SharedStateAgent> _logger;

    public SharedStateAgent(
        AIAgent innerAgent,
        SharedStateStore store,
        ILogger<SharedStateAgent> logger)
        : base(innerAgent)
    {
        _store = store;
        _logger = logger;
    }

    protected override Task<AgentResponse> RunCoreAsync(
        IEnumerable<ChatMessage> messages,
        AgentSession? session = null,
        AgentRunOptions? options = null,
        CancellationToken cancellationToken = default)
        => RunCoreStreamingAsync(messages, session, options, cancellationToken)
            .ToAgentResponseAsync(cancellationToken);

    protected override async IAsyncEnumerable<AgentResponseUpdate> RunCoreStreamingAsync(
        IEnumerable<ChatMessage> messages,
        AgentSession? session = null,
        AgentRunOptions? options = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var stateWasProvided = Hydrate(options);
        var stateAwareMessages = AddStateContext(messages);

        await foreach (var update in InnerAgent
            .RunStreamingAsync(stateAwareMessages, session, options, cancellationToken)
            .ConfigureAwait(false))
        {
            yield return update;
        }

        // Preserve normal chat/tool runs for agents that do not use shared state.
        // Emitting an empty DataContent event can be parsed as an AG-UI state
        // event and destabilize the popup after a candidate tool result.
        if (!stateWasProvided && !_store.HasState) yield break;

        var stateBytes = JsonSerializer.SerializeToUtf8Bytes(_store.Snapshot());
        yield return new AgentResponseUpdate
        {
            Contents = [new DataContent(stateBytes, "application/json")]
        };
        _logger.LogDebug("Shared state snapshot emitted. Keys={Keys}", _store.SnapshotKeys());
    }

    private IEnumerable<ChatMessage> AddStateContext(IEnumerable<ChatMessage> messages)
    {
        if (_store.SnapshotKeys().Count == 0) return messages;

        return messages.Prepend(new ChatMessage(
            ChatRole.System,
            [new TextContent(
                "Current shared application state summary (read-only context for this turn):\n" +
                _store.AgentContextText())]));
    }

    private bool Hydrate(AgentRunOptions? options)
    {
        if (options is not ChatClientAgentRunOptions
            {
                ChatOptions.AdditionalProperties: { } properties
            }
            || !properties.TryGetValue(StateOptionKey, out var state)
            || state is not JsonElement stateElement)
        {
            return false;
        }

        _store.Hydrate(stateElement);
        _logger.LogDebug("Shared state hydrated from AG-UI input.");
        return stateElement.ValueKind == JsonValueKind.Object && stateElement.EnumerateObject().Any();
    }
}
