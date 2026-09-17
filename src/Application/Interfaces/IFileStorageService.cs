namespace Application.Interfaces
{
    public interface IFileStorageService
    {
        Task UploadAsync(
            Stream fileStream,
            string objectName,
            string contentType,
            long fileSize,
            CancellationToken cancellationToken = default);

        Task<Stream> DownloadAsync(
            string objectName,
            CancellationToken cancellationToken = default);

        Task DeleteAsync(
            string objectName,
            CancellationToken cancellationToken = default);

        Task<string> CreatePresignedUrlAsync(
            string objectName,
            int expirySeconds = 300,
            CancellationToken cancellationToken = default);
    }
}

