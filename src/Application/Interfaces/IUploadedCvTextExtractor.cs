namespace Application.Interfaces;

public interface IUploadedCvTextExtractor
{
    Task<string> ExtractAsync(
        Stream fileStream,
        string fileName,
        CancellationToken cancellationToken = default);
}
