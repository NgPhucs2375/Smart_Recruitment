using System.Text.Json;
using System.Text.Json.Nodes;

namespace WebApp.Server.Agent.SharedState;

/// <summary>
/// Request-scoped state exchanged with the frontend through AG-UI.
/// Domain agents own the meaning of individual keys; this store only owns
/// hydration, serialization, and replacement semantics.
/// </summary>
internal sealed class SharedStateStore
{
    private readonly JsonSerializerOptions _serializerOptions = new(JsonSerializerDefaults.Web);
    private JsonObject _state = new();

    public void Hydrate(JsonElement state)
    {
        if (state.ValueKind != JsonValueKind.Object) return;

        var hydrated = JsonNode.Parse(state.GetRawText()) as JsonObject;
        if (hydrated is not null) _state = hydrated;
    }

    public void Set<T>(string key, T value)
    {
        _state[key] = JsonSerializer.SerializeToNode(value, _serializerOptions);
    }

    public JsonElement Snapshot()
    {
        using var document = JsonDocument.Parse(_state.ToJsonString());
        return document.RootElement.Clone();
    }

    public string RawText() => _state.ToJsonString();

    public string AgentContextText()
    {
        var context = new JsonObject();
        foreach (var (key, value) in _state)
        {
            if (value is JsonArray array)
            {
                context[$"{key}Count"] = array.Count;
                continue;
            }

            if (value is JsonValue) context[key] = value?.DeepClone();
        }

        return context.ToJsonString();
    }

    public bool HasState => _state.Count > 0;

    public IReadOnlyCollection<string> SnapshotKeys() => _state.Select(x => x.Key).ToArray();
}
