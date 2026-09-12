namespace Application.Interfaces.Repositories
{
    public interface ICvEmbeddingService
    {
        Task GenerateAsync(
            int cvId,
            CancellationToken cancellationToken = default);
    }
}