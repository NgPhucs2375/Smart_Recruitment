using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OllamaSharp;

namespace RecruitmentAgent.ChatClients;

/// <summary>
/// Default chat client using the Ollama API (local or remote).
/// Reads <c>Ollama:BaseUrl</c> (or <c>OLLAMA_BASE_URL</c>, default
/// <c>http://localhost:11434</c>) and <c>Chat:Model</c> (or <c>CHAT__MODEL</c>).
/// <c>OllamaApiClient</c> implements <c>IChatClient</c> directly, so no
/// OpenAI-compatible wrapper is needed.
/// </summary>
public sealed class OllamaChatClientImpl : IChatClient
{
    private readonly IChatClient _inner;

    public OllamaChatClientImpl(IConfiguration config, ILoggerFactory loggerFactory)
    {
        var logger = loggerFactory.CreateLogger<OllamaChatClientImpl>();
        var baseUrl = config["Ollama:BaseUrl"]
            ?? config["Ollama:Endpoint"]
            ?? Environment.GetEnvironmentVariable("OLLAMA_BASE_URL")
            ?? "http://localhost:11434";
        var model = config["Chat:Model"]
            ?? Environment.GetEnvironmentVariable("CHAT__MODEL")
            ?? Environment.GetEnvironmentVariable("OLLAMA_MODEL")
            ?? config["Ollama:Model"]
            ?? "gpt-oss:120b-cloud";
        logger.LogInformation("Ollama chat client: model={Model} baseUrl={BaseUrl}", model, baseUrl);

        _inner = new OllamaApiClient(new Uri(baseUrl), model);
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
