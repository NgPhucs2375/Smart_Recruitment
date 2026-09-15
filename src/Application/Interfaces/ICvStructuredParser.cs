using Application.DTOs.CV;

namespace Application.Interfaces;

public interface ICvStructuredParser
{
    Task<ParsedCvDto> ParseAsync(
        string rawText,
        CancellationToken cancellationToken = default);
}
