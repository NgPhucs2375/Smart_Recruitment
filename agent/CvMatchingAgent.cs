using System.Diagnostics.CodeAnalysis;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Agents.AI;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging;

namespace RecruitmentAgent;

/// <summary>
/// Mirrors form-filling <c>agent/FormFillAgent.cs</c> (a <see cref="DelegatingAIAgent"/>
/// that moves uploaded files into <c>HttpContext.Items</c> and emits accumulated
/// tool results as a <c>DataContent</c> JSON state update).
/// Domain: CV ↔ tin tuyển dụng matches instead of document ↔ form fills.
/// Emits <c>{"matches": [...]}</c> so the frontend can render result cards.
/// </summary>
[SuppressMessage("Performance", "CA1812", Justification = "Instantiated by CvMatchingAgentFactory")]
internal sealed class CvMatchingAgent(
    AIAgent innerAgent,
    IHttpContextAccessor httpContextAccessor,
    ILogger logger)
    : DelegatingAIAgent(innerAgent)
{
    protected override Task<AgentResponse> RunCoreAsync(
        IEnumerable<ChatMessage> messages,
        AgentSession? session = null,
        AgentRunOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        return RunCoreStreamingAsync(messages, session, options, cancellationToken)
            .ToAgentResponseAsync(cancellationToken);
    }

    protected override async IAsyncEnumerable<AgentResponseUpdate> RunCoreStreamingAsync(
        IEnumerable<ChatMessage> messages,
        AgentSession? session = null,
        AgentRunOptions? options = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var enriched = PrepareMessages(messages.ToList());

        await foreach (var update in InnerAgent.RunStreamingAsync(enriched, session, options, cancellationToken).ConfigureAwait(false))
            yield return update;

        if (httpContextAccessor.HttpContext?.Items["__cv_matches__"] is List<CvMatchResult> matches && matches.Count > 0)
        {
            var stateBytes = JsonSerializer.SerializeToUtf8Bytes(new CvMatchResultList { Matches = matches });
            yield return new AgentResponseUpdate
            {
                Contents = [new DataContent(stateBytes, "application/json")],
            };
            logger.LogInformation("Emitted {Count} CV match(es)", matches.Count);
            httpContextAccessor.HttpContext.Items.Remove("__cv_matches__");
        }
    }

    private IEnumerable<ChatMessage> PrepareMessages(List<ChatMessage> messages)
    {
        var lastUserMessage = messages.LastOrDefault(m => m.Role == ChatRole.User);
        var dataContentFiles = lastUserMessage?.Contents
            .OfType<DataContent>()
            .Where(d => IsCvType(d.MediaType))
            .Select(d => new ExtractedFile(ExtractBytes(d), d.MediaType ?? "application/octet-stream"))
            .Where(f => f.Bytes.Length > 0)
            .ToList() ?? [];

        if (dataContentFiles.Count > 0 && httpContextAccessor.HttpContext is { } ctx)
        {
            var existing = ctx.Items["__attachments__"] as List<ExtractedFile> ?? [];
            ctx.Items["__attachments__"] = existing.Concat(dataContentFiles).ToList();
            logger.LogInformation("Stored {Count} DataContent file(s) for parse_cv_document tool", dataContentFiles.Count);
        }

        var totalFiles = ((httpContextAccessor.HttpContext?.Items["__attachments__"] as List<ExtractedFile>) ?? []).Count;
        if (totalFiles == 0)
            return messages;

        var hint = new ChatMessage(
            ChatRole.System,
            $"The user has uploaded {totalFiles} CV file(s). Call parse_cv_document to extract their content, " +
            "then call search_tin_tuyen_dung to find matching job posts.");

        return messages.Prepend(hint);
    }

    private static byte[] ExtractBytes(DataContent content)
    {
        if (!content.Data.IsEmpty)
            return content.Data.ToArray();

        if (content.Uri is { } uri && uri.StartsWith("data:"))
        {
            var commaIndex = uri.IndexOf(',');
            if (commaIndex >= 0)
                return Convert.FromBase64String(uri[(commaIndex + 1)..]);
        }

        return [];
    }

    private static bool IsCvType(string? mediaType) =>
        mediaType is not null &&
        (mediaType.Contains("pdf") ||
         mediaType.Contains("word") ||
         mediaType.Contains("document") ||
         mediaType.Contains("image") ||
         mediaType.Contains("text/plain"));
}

internal sealed class CvMatchResult
{
    [JsonPropertyName("tinId")]
    public int TinId { get; set; }

    [JsonPropertyName("tieuDe")]
    public string? TieuDe { get; set; }

    [JsonPropertyName("lyDo")]
    public string? LyDo { get; set; }

    [JsonPropertyName("diemPhuHop")]
    public int DiemPhuHop { get; set; }
}

internal sealed class CvMatchResultList
{
    [JsonPropertyName("matches")]
    public List<CvMatchResult> Matches { get; set; } = [];
}
