namespace RecruitmentAgent.Services;

/// <summary>
/// Mirrors form-filling <c>agent/Services/IDocumentParserStrategy.cs</c> (Strategy pattern).
/// Select implementation via <c>DOCUMENT_PARSER_STRATEGY</c> env if more are added later.
/// </summary>
public interface IDocumentParserStrategy
{
    Task<string?> ParseAsync(byte[] fileBytes, string fileName, string mediaType, CancellationToken cancellationToken);
}
