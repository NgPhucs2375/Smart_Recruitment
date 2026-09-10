using System.Text;
using Microsoft.Extensions.Logging;

namespace RecruitmentAgent.Services;

/// <summary>
/// Zero-dependency default parser: reads plain text directly, decodes common
/// image/pdf/docx uploads as "metadata-only" notes instead of failing.
/// This keeps the agent build green without OCR packages. Swap with a real
/// OCR/ResOCR/MinerU strategy (see form-filling
/// <c>agent/Services/*ParserStrategy.cs</c>) when those services are available —
/// the <c>IDocumentParserStrategy</c> contract stays identical.
/// </summary>
public sealed class PlainTextParserStrategy(ILogger<PlainTextParserStrategy> logger) : IDocumentParserStrategy
{
    public Task<string?> ParseAsync(byte[] fileBytes, string fileName, string mediaType, CancellationToken cancellationToken)
    {
        if (fileBytes.Length == 0) return Task.FromResult<string?>(null);

        if (mediaType.Contains("text/plain", StringComparison.OrdinalIgnoreCase)
            || fileName.EndsWith(".txt", StringComparison.OrdinalIgnoreCase)
            || fileName.EndsWith(".md", StringComparison.OrdinalIgnoreCase)
            || fileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
        {
            var text = Encoding.UTF8.GetString(fileBytes);
            logger.LogInformation("Parsed plain text {File} ({Length} chars)", fileName, text.Length);
            return Task.FromResult<string?>(text);
        }

        logger.LogInformation(
            "No OCR configured: file {File} ({MediaType}, {Bytes} bytes) recorded as metadata-only",
            fileName, mediaType, fileBytes.Length);
        return Task.FromResult<string?>(
            $"[File đính kèm chưa trích xuất nội dung: {fileName} ({mediaType}, {fileBytes.Length} bytes). " +
            "Hãy hỏi ứng viên cung cấp nội dung text của CV.]");
    }
}
