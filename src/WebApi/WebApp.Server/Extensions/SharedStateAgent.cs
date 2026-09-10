using System.Diagnostics.CodeAnalysis;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;

#pragma warning disable MEAI001 // ContinuationToken is experimental

namespace WebApp.Server.Extensions;

[SuppressMessage("Performance", "CA1812:Avoid uninstantiated internal classes", Justification = "Instantiated by SmartAgentFactory")]
internal sealed class SharedStateAgent : DelegatingAIAgent
{
    private readonly JsonSerializerOptions _jsonSerializerOptions;

    public SharedStateAgent(AIAgent innerAgent, JsonSerializerOptions jsonSerializerOptions)
        : base(innerAgent)
    {
        _jsonSerializerOptions = jsonSerializerOptions;
    }

    protected override async Task<AgentResponse> RunCoreAsync(
        IEnumerable<ChatMessage> messages,
        AgentSession? session = null,
        AgentRunOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        return await RunCoreStreamingAsync(messages, session, options, cancellationToken)
            .ToAgentResponseAsync(cancellationToken).ConfigureAwait(false);
    }

    protected override async IAsyncEnumerable<AgentResponseUpdate> RunCoreStreamingAsync(
        IEnumerable<ChatMessage> messages,
        AgentSession? session = null,
        AgentRunOptions? options = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        if (options is not ChatClientAgentRunOptions { ChatOptions.AdditionalProperties: { } properties } chatRunOptions ||
            !properties.TryGetValue("ag_ui_state", out JsonElement state))
        {
            await foreach (var update in InnerAgent.RunStreamingAsync(messages, session, options, cancellationToken).ConfigureAwait(false))
            {
                yield return update;
            }
            yield break;
        }

        var firstRunOptions = new ChatClientAgentRunOptions(chatRunOptions.ChatOptions.Clone())
        {
            AllowBackgroundResponses = chatRunOptions.AllowBackgroundResponses,
            ContinuationToken = chatRunOptions.ContinuationToken,
        };

        firstRunOptions.ChatOptions.ResponseFormat = ChatResponseFormat.ForJsonSchema<CVStateSnapshot>(
            schemaName: "CVStateSnapshot",
            schemaDescription: "A response containing the current CV state");

        ChatMessage stateUpdateMessage = new(
            ChatRole.System,
            [
                new TextContent("Trạng thái CV hiện tại (JSON format):"),
                new TextContent(state.GetRawText()),
                new TextContent("Hãy trích xuất thông tin từ hội thoại và trả về trạng thái CV mới nhất (giữ lại các trường không đổi):")
            ]);

        var firstRunMessages = messages.Append(stateUpdateMessage);

        var allUpdates = new List<AgentResponseUpdate>();
        await foreach (var update in InnerAgent.RunStreamingAsync(firstRunMessages, session, firstRunOptions, cancellationToken).ConfigureAwait(false))
        {
            allUpdates.Add(update);

            bool hasNonTextContent = update.Contents?.Any(c => c is not TextContent) == true;
            if (hasNonTextContent)
            {
                yield return update;
            }
        }

        var response = allUpdates.ToAgentResponse();

        // Gửi JSON State về Client để UI tự động cập nhật Form
        var jsonContent = response.Messages
            .SelectMany(m => m.Contents)
            .OfType<DataContent>()
            .FirstOrDefault(c => c.MediaType == "application/json");

        if (jsonContent?.Data is { Length: > 0 } data)
        {
            yield return new AgentResponseUpdate
            {
                Contents = [new DataContent(data, "application/json")]
            };
        }
        else
        {
            yield break;
        }

        ChatMessage conversationalPrompt = new(
                ChatRole.System,
                [
                    new TextContent("""
                        Dựa trên thông tin vừa được cập nhật vào CV:
                        1. Xác nhận ngắn gọn phần thông tin bạn vừa ghi nhận và chuẩn hóa trên CV.
                        2. Đưa ra góp ý chuyên môn hoặc đặt 1 câu hỏi gợi mở tiếp theo để người dùng tiếp tục hoàn thiện các phần còn thiếu (Mục tiêu, Kinh nghiệm chi tiết, Kỹ năng trọng tâm).
                        """)
                ]);

        var secondRunMessages = messages.Append(conversationalPrompt);

        await foreach (var update in InnerAgent.RunStreamingAsync(secondRunMessages, session, options, cancellationToken).ConfigureAwait(false))
        {
            yield return update;
        }
    }
}

// =================
// CV State Snapshot
// =================
public class CVStateSnapshot
{
    [JsonPropertyName("fullName")]
    public string FullName { get; set; } = string.Empty;

    [JsonPropertyName("summary")]
    public string Summary { get; set; } = string.Empty;

    [JsonPropertyName("experience")]
    public string Experience { get; set; } = string.Empty;

    [JsonPropertyName("skills")]
    public List<string> Skills { get; set; } = [];
}
