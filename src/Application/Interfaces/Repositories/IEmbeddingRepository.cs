using Domain.Enums;

namespace Application.Interfaces.Repositories;

public interface IEmbeddingRepository
{
    Task<float[]> GenerateEmbeddingAsync(
        string text,
        EmbeddingTaskType taskType,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<float[]>> GenerateEmbeddingsAsync(
        IReadOnlyList<string> texts,
        EmbeddingTaskType taskType,
        CancellationToken cancellationToken = default);

    
}