using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace WebApp.Server.Agent.Threads;

/// <summary>
/// Lưu lịch sử hội thoại agent Adam theo threadId vào Redis (shared store):
/// - agent:thread:{userId}:{threadId}        — JSON snapshot (messages + metadata), TTL Agent:ThreadTtlHours.
/// - agent:thread:{userId}:{threadId}:runs   — LIST các run record (events thô, tool, status) làm audit trail.
/// - agent:thread:index:{userId}             — ZSET score=lastActivity, giữ tối đa Agent:ThreadIndexKeep thread gần nhất.
/// userId nằm trong key nên không bao giờ trộn chéo giữa các user.
/// Redis lỗi thì ném exception — caller (middleware) tự fail-open; read API trả 500.
/// </summary>
public sealed class AgentThreadStore
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private static readonly Regex ThreadIdPattern =
        new("^[A-Za-z0-9._-]{1,128}$", RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private readonly IConnectionMultiplexer _redis;
    private readonly ICurrentNguoiDungService _current;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AgentThreadStore> _logger;

    public AgentThreadStore(
        IConnectionMultiplexer redis,
        ICurrentNguoiDungService current,
        IConfiguration configuration,
        ILogger<AgentThreadStore> logger)
    {
        _redis = redis;
        _current = current;
        _configuration = configuration;
        _logger = logger;
    }

    public static bool IsValidThreadId(string? threadId)
        => !string.IsNullOrEmpty(threadId) && ThreadIdPattern.IsMatch(threadId);

    public TimeSpan Ttl => TimeSpan.FromHours(Math.Max(1, _configuration.GetValue("Agent:ThreadTtlHours", 168)));
    public int MaxRuns => Math.Clamp(_configuration.GetValue("Agent:ThreadMaxRuns", 50), 5, 500);
    public int MaxMessages => Math.Clamp(_configuration.GetValue("Agent:ThreadMaxMessages", 200), 20, 2000);
    public int IndexKeep => Math.Clamp(_configuration.GetValue("Agent:ThreadIndexKeep", 100), 10, 1000);

    public async Task<int?> CurrentUserIdAsync()
    {
        try
        {
            return (await _current.ResolveAsync()).Id;
        }
        catch
        {
            return null;
        }
    }

    public async Task SaveAsync(int userId, AgentThreadSaveData data, CancellationToken cancellationToken = default)
    {
        var db = _redis.GetDatabase();
        var threadKey = ThreadKey(userId, data.ThreadId);
        var runsKey = $"{threadKey}:runs";
        var indexKey = IndexKey(userId);
        var now = DateTimeOffset.UtcNow;

        // Snapshot metadata hiện có (Created/RunCount); messages lấy làm base từ input history của client.
        AgentThreadSnapshot? existing = null;
        var existingRaw = await db.StringGetAsync(threadKey);
        if (existingRaw.HasValue)
        {
            try
            {
                existing = JsonSerializer.Deserialize<AgentThreadSnapshot>((string)existingRaw!, Json);
            }
            catch (JsonException)
            {
                _logger.LogWarning("Agent thread snapshot hỏng, tạo lại. Key={Key}", threadKey);
            }
        }

        var messages = MergeMessages(data.InputMessages, data.OutputMessages, MaxMessages);
        var snapshot = new AgentThreadSnapshot
        {
            ThreadId = data.ThreadId,
            AgentId = data.AgentId ?? existing?.AgentId,
            Created = existing?.Created ?? now,
            Updated = now,
            RunCount = (existing?.RunCount ?? 0) + 1,
            LastRunId = data.RunId ?? existing?.LastRunId,
            Messages = messages
        };

        var runRecord = new AgentThreadRunRecord
        {
            RunId = data.RunId ?? Guid.NewGuid().ToString("n"),
            At = now,
            Status = data.Status,
            InputMessageCount = data.InputMessageCount,
            EventCount = data.Events.Count,
            Tools = CollectToolNames(data.Events),
            Events = data.Events.Select(e => e.DeepClone()).ToList()
        };

        var tran = db.CreateTransaction();
        var tasks = new Task[]
        {
            tran.StringSetAsync(threadKey, JsonSerializer.Serialize(snapshot, Json), Ttl),
            tran.ListRightPushAsync(runsKey, JsonSerializer.Serialize(runRecord, Json)),
            tran.ListTrimAsync(runsKey, -MaxRuns, -1),
            tran.KeyExpireAsync(runsKey, Ttl),
            tran.SortedSetAddAsync(indexKey, data.ThreadId, now.ToUnixTimeSeconds()),
            // ZSET xếp theo score tăng dần: xóa từ đầu đến -(keep+1) để giữ keep thread mới nhất.
            tran.SortedSetRemoveRangeByRankAsync(indexKey, 0, -(IndexKeep + 1)),
            tran.KeyExpireAsync(indexKey, Ttl)
        };

        var committed = await tran.ExecuteAsync();
        if (!committed)
        {
            _logger.LogWarning(
                "Redis transaction lưu thread thất bại (aborted). UserId={UserId}, ThreadId={ThreadId}",
                userId, data.ThreadId
            );
            return;
        }
        await Task.WhenAll(tasks);

        _logger.LogInformation(
            "Agent thread đã lưu. UserId={UserId}, ThreadId={ThreadId}, RunId={RunId}, Status={Status}, Events={EventCount}, Messages={MessageCount}",
            userId, data.ThreadId, runRecord.RunId, data.Status, runRecord.EventCount, snapshot.Messages.Count);
    }

    public async Task<AgentThreadSnapshot?> GetAsync(int userId, string threadId, CancellationToken cancellationToken = default)
    {
        var raw = await _redis.GetDatabase().StringGetAsync(ThreadKey(userId, threadId));
        if (!raw.HasValue) return null;
        try
        {
            return JsonSerializer.Deserialize<AgentThreadSnapshot>((string)raw!, Json);
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Agent thread snapshot hỏng. ThreadId={ThreadId}", threadId);
            return null;
        }
    }

    public async Task<IReadOnlyList<AgentThreadSummary>> ListAsync(int userId, int limit = 50, CancellationToken cancellationToken = default)
    {
        limit = Math.Clamp(limit, 1, IndexKeep);
        var db = _redis.GetDatabase();
        var members = await db.SortedSetRangeByRankAsync(IndexKey(userId), 0, limit - 1, Order.Descending);
        if (members.Length == 0) return Array.Empty<AgentThreadSummary>();

        var keys = members.Select(m => (RedisKey)ThreadKey(userId, m.ToString())).ToArray();
        var values = await db.StringGetAsync(keys);

        var result = new List<AgentThreadSummary>(values.Length);
        for (var i = 0; i < values.Length; i++)
        {
            if (!values[i].HasValue) continue;
            try
            {
                var snapshot = JsonSerializer.Deserialize<AgentThreadSnapshot>((string)values[i]!, Json);
                if (snapshot != null)
                {
                    result.Add(new AgentThreadSummary
                    {
                        ThreadId = snapshot.ThreadId,
                        AgentId = snapshot.AgentId,
                        Created = snapshot.Created,
                        Updated = snapshot.Updated,
                        RunCount = snapshot.RunCount,
                        LastRunId = snapshot.LastRunId,
                        MessageCount = snapshot.Messages.Count
                    });
                }
            }
            catch (JsonException)
            {
                // Bỏ qua entry hỏng, không chặn cả danh sách.
            }
        }
        return result;
    }

    public async Task<IReadOnlyList<JsonNode>> GetEventsAsync(int userId, string threadId, CancellationToken cancellationToken = default)
    {
        var raw = await _redis.GetDatabase().ListRangeAsync($"{ThreadKey(userId, threadId)}:runs");
        var events = new List<JsonNode>();
        foreach (var item in raw)
        {
            if (!item.HasValue) continue;
            try
            {
                var run = JsonSerializer.Deserialize<AgentThreadRunRecord>((string)item!, Json);
                if (run?.Events != null) events.AddRange(run.Events);
            }
            catch (JsonException)
            {
                // Bỏ qua run record hỏng.
            }
        }
        return events;
    }

    public async Task<bool> DeleteAsync(int userId, string threadId, CancellationToken cancellationToken = default)
    {
        var db = _redis.GetDatabase();
        var threadKey = ThreadKey(userId, threadId);
        var tran = db.CreateTransaction();
        var tasks = new Task[]
        {
            tran.KeyDeleteAsync(new RedisKey[] { threadKey, $"{threadKey}:runs" }),
            tran.SortedSetRemoveAsync(IndexKey(userId), threadId)
        };

        var committed = await tran.ExecuteAsync();
        if (!committed)
        {
            _logger.LogWarning(
                "Redis transaction xóa thread thất bại (aborted). UserId={UserId}, ThreadId={ThreadId}",
                userId, threadId
            );
        }
        await Task.WhenAll(tasks);
        return true;
    }

    private string ThreadKey(int userId, string threadId) => $"agent:thread:{userId}:{threadId}";
    private string IndexKey(int userId) => $"agent:thread:index:{userId}";

    /// <summary>
    /// Client gửi lại TOÀN BỘ history mỗi run nên input đã là base chronology;
    /// output (assistant/tool messages mới) append vào sau, dedupe theo id, cắt còn max messages.
    /// </summary>
    private static List<JsonNode> MergeMessages(
        IReadOnlyList<JsonNode>? inputMessages,
        IReadOnlyList<JsonNode>? outputMessages,
        int max)
    {
        var merged = new List<JsonNode>();
        var seen = new HashSet<string>(StringComparer.Ordinal);

        void AddRange(IReadOnlyList<JsonNode>? source)
        {
            if (source == null) return;
            foreach (var message in source)
            {
                if (message is not JsonObject obj) continue;
                var id = obj["id"]?.GetValue<string>();
                if (string.IsNullOrEmpty(id) || !seen.Add(id)) continue;
                merged.Add(obj);
            }
        }

        AddRange(inputMessages);
        AddRange(outputMessages);

        if (merged.Count > max)
        {
            merged = merged.Skip(merged.Count - max).ToList();
        }
        return merged;
    }

    private static List<string> CollectToolNames(IReadOnlyList<JsonNode> events)
    {
        var names = new List<string>();
        var seen = new HashSet<string>(StringComparer.Ordinal);
        foreach (var e in events)
        {
            if (e is not JsonObject obj) continue;
            if (obj["type"]?.GetValue<string>() != "TOOL_CALL_START") continue;
            var name = obj["toolCallName"]?.GetValue<string>() ?? obj["name"]?.GetValue<string>();
            if (!string.IsNullOrEmpty(name) && seen.Add(name)) names.Add(name);
        }
        return names;
    }
}

public sealed class AgentThreadSnapshot
{
    public string ThreadId { get; set; } = "";
    public string? AgentId { get; set; }
    public DateTimeOffset Created { get; set; }
    public DateTimeOffset Updated { get; set; }
    public int RunCount { get; set; }
    public string? LastRunId { get; set; }
    public List<JsonNode> Messages { get; set; } = new();
}

public sealed class AgentThreadRunRecord
{
    public string RunId { get; set; } = "";
    public DateTimeOffset At { get; set; }
    public string Status { get; set; } = "ok";
    public int InputMessageCount { get; set; }
    public int EventCount { get; set; }
    public List<string> Tools { get; set; } = new();
    public List<JsonNode> Events { get; set; } = new();
}

public sealed class AgentThreadSummary
{
    public string ThreadId { get; set; } = "";
    public string? AgentId { get; set; }
    public DateTimeOffset Created { get; set; }
    public DateTimeOffset Updated { get; set; }
    public int RunCount { get; set; }
    public string? LastRunId { get; set; }
    public int MessageCount { get; set; }
}

public sealed class AgentThreadSaveData
{
    public required string ThreadId { get; init; }
    public string? RunId { get; init; }
    public string? AgentId { get; init; }
    public string Status { get; init; } = "ok";
    public int InputMessageCount { get; init; }
    public required IReadOnlyList<JsonNode> Events { get; init; }
    public required IReadOnlyList<JsonNode> InputMessages { get; init; }
    public required IReadOnlyList<JsonNode> OutputMessages { get; init; }
}
