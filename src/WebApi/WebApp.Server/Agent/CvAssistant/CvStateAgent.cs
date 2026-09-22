using System.Runtime.CompilerServices;
using System.Text.Json;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;

#pragma warning disable MEAI001

namespace WebApp.Server.Agent.CvAssistant;

// Đồng bộ state AG-UI với form CV, sau đó chạy thêm một lượt để trả lời hội thoại.
internal sealed class CvStateAgent : DelegatingAIAgent
{
    public CvStateAgent(AIAgent innerAgent)
        : base(innerAgent)
    {
    }

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
        if (options is not ChatClientAgentRunOptions { ChatOptions.AdditionalProperties: { } properties } chatRunOptions ||
            !properties.TryGetValue("ag_ui_state", out JsonElement state))
        {
            await foreach (var update in InnerAgent
                .RunStreamingAsync(messages, session, options, cancellationToken)
                .ConfigureAwait(false))
            {
                yield return update;
            }

            yield break;
        }

        var stateChatOptions = chatRunOptions.ChatOptions.Clone();
        stateChatOptions.ResponseFormat = ChatResponseFormat.ForJsonSchema<CvStateSnapshot>(
            schemaName: nameof(CvStateSnapshot),
            schemaDescription: "Trạng thái CV hiện tại sau khi hợp nhất thông tin mới");

        var stateRunOptions = new ChatClientAgentRunOptions(stateChatOptions)
        {
            AllowBackgroundResponses = chatRunOptions.AllowBackgroundResponses,
            ContinuationToken = chatRunOptions.ContinuationToken,
        };

        ChatMessage statePrompt = new(
            ChatRole.System,
            [
                new TextContent("Trạng thái CV hiện tại (JSON):"),
                new TextContent(state.GetRawText()),
                new TextContent("Hãy hợp nhất thông tin mới từ hội thoại và giữ nguyên trường không thay đổi.")
            ]);

        var stateUpdates = new List<AgentResponseUpdate>();
        await foreach (var update in InnerAgent
            .RunStreamingAsync(messages.Append(statePrompt), session, stateRunOptions, cancellationToken)
            .ConfigureAwait(false))
        {
            stateUpdates.Add(update);
            if (update.Contents?.Any(content => content is not TextContent) == true)
            {
                yield return update;
            }
        }

        var jsonContent = stateUpdates.ToAgentResponse().Messages
            .SelectMany(message => message.Contents)
            .OfType<DataContent>()
            .FirstOrDefault(content => content.MediaType == "application/json");
        if (jsonContent?.Data is not { Length: > 0 } data)
        {
            yield break;
        }

        yield return new AgentResponseUpdate
        {
            Contents = [new DataContent(data, "application/json")]
        };

        ChatMessage responsePrompt = new(
            ChatRole.System,
            """
            Dựa trên thông tin CV vừa cập nhật:
            1. Xác nhận ngắn gọn nội dung vừa ghi nhận và chuẩn hóa.
            2. Góp ý chuyên môn hoặc đặt một câu hỏi gợi mở để hoàn thiện phần còn thiếu.
            """);

        await foreach (var update in InnerAgent
            .RunStreamingAsync(messages.Append(responsePrompt), session, options, cancellationToken)
            .ConfigureAwait(false))
        {
            yield return update;
        }
    }
}
