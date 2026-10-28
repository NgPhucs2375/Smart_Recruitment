using System.IO.Compression;
using System.Text;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;
using System;
using System.Xml.Linq;
using Application.Interfaces;
using UglyToad.PdfPig;

namespace Infrastructure.Shared.Services;

public sealed class UploadedCvTextExtractor : IUploadedCvTextExtractor
{
    public async Task<string> ExtractAsync(
        Stream fileStream,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(fileName);
        return extension.ToLowerInvariant() switch
        {
            ".pdf" => ExtractPdf(fileStream),
            ".docx" => await ExtractDocxAsync(fileStream, cancellationToken),
            ".json" => await ReadTextAsync(fileStream, cancellationToken),
            _ => throw new InvalidOperationException(
                "Chỉ hỗ trợ file PDF, DOCX hoặc JSON."),
        };
    }

    private static string ExtractPdf(Stream stream)
    {
        using var document = PdfDocument.Open(stream);
        var builder = new StringBuilder();
        foreach (var page in document.GetPages())
        {
            builder.AppendLine(page.Text);
        }

        return builder.ToString();
    }

    private static async Task<string> ExtractDocxAsync(
        Stream stream,
        CancellationToken cancellationToken)
    {
        using var archive = new ZipArchive(stream, ZipArchiveMode.Read, leaveOpen: false);
        var entry = archive.GetEntry("word/document.xml")
            ?? throw new InvalidOperationException("DOCX không chứa nội dung văn bản.");
        await using var entryStream = entry.Open();
        var xml = await ReadTextAsync(entryStream, cancellationToken);
        var document = System.Xml.Linq.XDocument.Parse(xml);
        XNamespace word = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
        return string.Join(
            Environment.NewLine,
            document.Descendants(word + "p")
                .Select(paragraph => string.Concat(
                    paragraph.Descendants(word + "t").Select(text => text.Value))));
    }

    private static async Task<string> ReadTextAsync(
        Stream stream,
        CancellationToken cancellationToken)
    {
        using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
        return await reader.ReadToEndAsync(cancellationToken);
    }
}
