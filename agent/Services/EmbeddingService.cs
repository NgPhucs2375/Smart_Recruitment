using Microsoft.Extensions.Logging;

namespace RecruitmentAgent.Services;

/// <summary>
/// Embedding hook. Form-filling uses Ollama <c>bge-m3</c> + pgvector
/// (<c>agent/Services/EmbeddingService.cs</c> + <c>DbService.SearchKnowledge</c>).
/// This project has neither OllamaSharp nor pgvector wired, so the default is a
/// null-object: chunking + keyword search work, vector ranking is a TODO.
/// Implement <c>IEmbeddingService</c> with the Ollama/Groq endpoint later without
/// touching callers.
/// </summary>
public interface IEmbeddingService
{
    Task<float[]?> EmbedAsync(string? text, CancellationToken ct = default);
}

public sealed class NullEmbeddingService(ILogger<NullEmbeddingService> logger) : IEmbeddingService
{
    public Task<float[]?> EmbedAsync(string? text, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(text)) return Task.FromResult<float[]?>(null);
        logger.LogDebug("NullEmbeddingService: skipping embedding ({Length} chars)", text!.Length);
        return Task.FromResult<float[]?>(null);
    }
}
