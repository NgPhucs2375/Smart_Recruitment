using System.IO.Compression;
using System.Text;
using System.Collections.Generic;
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
        var body = document.Root?.Element(word + "body")
            ?? throw new InvalidOperationException("DOCX không chứa nội dung văn bản.");
        var lines = new List<string>();
        AppendContent(body, word, lines);
        return string.Join(Environment.NewLine, lines);
    }

    /// <summary>
    /// Đọc document.xml theo đúng thứ tự tài liệu. Đoạn văn ra một dòng; mỗi hàng
    /// bảng ra một dòng "ô1 | ô2" để nhãn còn nằm cạnh giá trị. Cách cũ lấy mọi
    /// w:p bằng Descendants, nên bảng hai cột (mẫu CV kiểu TopCV) bị rải thành các
    /// dòng đơn lẻ và mô hình suy diễn sai ô nào thuộc mục nào.
    /// </summary>
    private static void AppendContent(XElement element, XNamespace word, List<string> lines)
    {
        foreach (var child in element.Elements())
        {
            if (child.Name == word + "tbl")
            {
                foreach (var row in child.Elements(word + "tr"))
                {
                    // Ô rỗng (cell tạo khoảng trắng trong CV Word) không được biến thành
                    // " |  | " thừa; hàng hoàn toàn trống thì bỏ qua.
                    var cells = row.Elements(word + "tc")
                        .Select(cell => CellText(cell, word))
                        .Where(text => text.Length > 0)
                        .ToList();
                    if (cells.Count > 0) lines.Add(string.Join(" | ", cells));
                }
            }
            else if (child.Name == word + "p")
            {
                lines.Add(ParagraphText(child, word));
            }
            else
            {
                // w:sdt/w:sdtContent, w:txbxContent và mọi phần tử lạ khác:
                // đi deeper thay vì bỏ qua, để không mất nội dung như bản Descendants cũ.
                AppendContent(child, word, lines);
            }
        }
    }

    private static string CellText(XElement cell, XNamespace word)
    {
        var parts = new List<string>();
        AppendContent(cell, word, parts);
        return string.Join("; ", parts.Select(part => part.Trim()).Where(part => part.Length > 0));
    }

    private static string ParagraphText(XElement paragraph, XNamespace word) => string.Concat(
        paragraph.Descendants().Select(node => node.Name switch
        {
            var name when name == word + "t" => node.Value,
            var name when name == word + "tab" => " ",
            var name when name == word + "br" || name == word + "cr" => " ",
            _ => string.Empty
        }));

    private static async Task<string> ReadTextAsync(
        Stream stream,
        CancellationToken cancellationToken)
    {
        using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
        return await reader.ReadToEndAsync(cancellationToken);
    }
}
