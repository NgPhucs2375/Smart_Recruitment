using System.ClientModel;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OpenAI;

namespace RecruitmentAgent.ChatClients;

/// <summary>
/// Default chat client. Mirrors the existing
/// <c>WebApp.Server.Extensions.AIAgentExtension</c> Groq setup
/// (Omniroute OpenAI-compatible endpoint) so no new credentials are needed.
/// Form-filling equivalent: <c>agent/ChatClients/OpenAIChatClientImpl.cs</c>
/// (provider selected via config instead of <c>CHAT__PROVIDER</c>).
/// </summary>
public sealed class GroqChatClientImpl : IChatClient
{
    private readonly IChatClient _inner;

    public GroqChatClientImpl(IConfiguration config, ILoggerFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger<GroqChatClientImpl>();
        var apiKey = config["GROQ_API_KEY"]
            ?? Environment.GetEnvironmentVariable("GROQ_API_KEY")
            ?? throw new InvalidOperationException("Chưa khai báo GROQ_API_KEY trong file .env!");
        var endpoint = config["GROQ_ENDPOINT"]
            ?? Environment.GetEnvironmentVariable("GROQ_ENDPOINT")
            ?? "https://omniroute.operamind.one/v1";
        var model = config["Chat:Model"]
            ?? Environment.GetEnvironmentVariable("CHAT__MODEL")
            ?? "gpt";
        logger.LogInformation("Groq chat client: model={Model} endpoint={Endpoint}", model, endpoint);

        var client = new OpenAIClient(new ApiKeyCredential(apiKey), new OpenAIClientOptions
        {
            Endpoint = new Uri(endpoint),
        });
        _inner = client.GetChatClient(model).AsIChatClient();
    }

    public Task<ChatResponse> GetResponseAsync(
        IEnumerable<ChatMessage> chatMessages,
        ChatOptions? options = null,
        CancellationToken cancellationToken = default) =>
        _inner.GetResponseAsync(chatMessages, options, cancellationToken);

    public IAsyncEnumerable<ChatResponseUpdate> GetStreamingResponseAsync(
        IEnumerable<ChatMessage> chatMessages,
        ChatOptions? options = null,
        CancellationToken cancellationToken = default) =>
        _inner.GetStreamingResponseAsync(chatMessages, options, cancellationToken);

    public object? GetService(Type serviceType, object? serviceKey = null) =>
        _inner.GetService(serviceType, serviceKey);

    public void Dispose() => _inner.Dispose();
}
