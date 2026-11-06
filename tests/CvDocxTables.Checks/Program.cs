using System.IO.Compression;
using System.Text;
using Infrastructure.Shared.Services;

// CV .docx ở Việt Nam (mẫu TopCV, ITviec) gần như luôn là bảng hai cột: ô trái là
// nhãn mục, ô phải là nội dung. Bản trích xuất cũ lấy mọi w:p theo Descendants nên
// nhãn và giá trị rời thành hai dòng riêng, mô hình parse CV suy diễn sai ô nào
// thuộc mục nào. Suite này dựng file .docx thật (zip + word/document.xml) và chốt
// giao diện văn bản mà prompt parse CV được phép tin: một hàng bảng = một dòng
// "ô1 | ô2", theo đúng thứ tự tài liệu.

var checks = 0;
void Check(bool condition, string name)
{
    if (!condition) throw new Exception(name);
    checks++;
    Console.WriteLine("PASS " + name);
}

const string WordNamespace = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

var twoColumn = Table(
    Row(Cell(Para("Ho ten")), Cell(Para("Nguyen Van A"))),
    Row(Cell(Para("Email")), Cell(Para("a@example.com"))));
var nestedRow = Table(Row(Cell(Para("React")), Cell(Para("2 nam"))));

var caNhan = await Text(Para("THONG TIN CA NHAN") + twoColumn + Para("HOC VAN"));
Check(caNhan == "THONG TIN CA NHAN\nHo ten | Nguyen Van A\nEmail | a@example.com\nHOC VAN",
    "Two-column CV table keeps each row on one line, label next to value, in document order");
Check(!caNhan.Split('\n').Contains("Ho ten"),
    "A label never becomes a line of its own, so a section header cannot swallow the next row");

Check(await Text(twoColumn) == "Ho ten | Nguyen Van A\nEmail | a@example.com",
    "A document that is only a table still extracts every row");

Check(await Text(Para("Nguyen Van A") + Para("a@example.com")) == "Nguyen Van A\na@example.com",
    "Regression: a CV without tables extracts the same plain lines as before");

Check(await Text(Table(Row(Cell(Para("Ky nang")), Cell(Para("Frontend") + Para("Backend")))))
    == "Ky nang | Frontend; Backend",
    "Several paragraphs in one cell are joined into that cell instead of faking extra rows");

Check(await Text(Table(Row(Cell(Para("Ky nang")), Cell(Para("Frontend") + nestedRow + Para("Backend")))))
    == "Ky nang | Frontend; React | 2 nam; Backend",
    "A table nested inside a cell is folded into that cell with the same separator as the outer row");

Check(await Text(Table(Row(Cell(Para("Chung chi")), Cell(""), Cell(Para("IELTS 6.5"))))) == "Chung chi | IELTS 6.5",
    "Empty spacer cells do not leave dangling separators");

Check(await Text(Table(Row(Cell(""), Cell("")))) == "",
    "A fully empty row produces no line");

Check(await Text(Table(Row(Cell(Para("Ha Noi")), Cell(Sdt(Para("2024 - 2026")))))) == "Ha Noi | 2024 - 2026",
    "Content inside a content control (w:sdt) is not dropped");

Check(await Text(Table(Row(Cell(Para("Du an")), Cell(Textbox(Para("Chatbot ATS")))))) == "Du an | Chatbot ATS",
    "Content inside a text box (w:txbxContent) is not dropped");

Check(await Text(Para("Ca truc", Tab(), "2024")) == "Ca truc 2024",
    "Tabs inside a paragraph become spaces, never a fake column separator");

Check(await Text(Para("backend", Br(), "devops")) == "backend devops",
    "Line breaks inside a paragraph stay on the same extracted line");

Check(await Text(Table(
    Row(Cell(Para("Cong ty")), Cell(Para("Vi tri")), Cell(Para("Thoi gian"))),
    Row(Cell(Para("FPT")), Cell(Para("Dev")), Cell(Para("2024 - 2026")))))
    == "Cong ty | Vi tri | Thoi gian\nFPT | Dev | 2024 - 2026",
    "Three-column experience tables keep one line per row");

// Các nhánh còn lại của extractor phải giữ nguyên hành vi cũ.
using (var json = new MemoryStream(Encoding.UTF8.GetBytes("""{"HoTen":"A"}""")))
    Check(await new UploadedCvTextExtractor().ExtractAsync(json, "cv.json") == """{"HoTen":"A"}""",
        "JSON uploads are still returned verbatim");

try
{
    using var xlsx = new MemoryStream(new byte[] { 1, 2, 3 });
    await new UploadedCvTextExtractor().ExtractAsync(xlsx, "cv.xlsx");
    throw new Exception("unsupported extension should have thrown");
}
catch (InvalidOperationException exception)
{
    Check(exception.Message == "Chỉ hỗ trợ file PDF, DOCX hoặc JSON.",
        "Unsupported uploads still fail with the original Vietnamese message");
}

try
{
    using var noDocument = new MemoryStream();
    using (var archive = new ZipArchive(noDocument, ZipArchiveMode.Create, true))
        archive.CreateEntry("word/settings.xml");
    noDocument.Position = 0;
    await new UploadedCvTextExtractor().ExtractAsync(noDocument, "cv.docx");
    throw new Exception("document.xml-less docx should have thrown");
}
catch (InvalidOperationException exception)
{
    Check(exception.Message == "DOCX không chứa nội dung văn bản.",
        "A .docx without word/document.xml still reports the original Vietnamese message");
}

Console.WriteLine($"OK {checks} DOCX table extraction checks");
return;

// word/document.xml không khai báo namespace mặc định, nên mọi phần tử phải mang
// tiền tố w: để XmlReader trả về đúng tên đã đủ namespace như file Word thật.
static string Para(params string[] inlines) =>
    "<w:p>" + string.Concat(inlines.Select(inline =>
        inline.StartsWith("<w:") ? inline : $"<w:r><w:t>{inline}</w:t></w:r>")) + "</w:p>";
static string Cell(string content = "") => $"<w:tc>{content}</w:tc>";
static string Row(params string[] cells) => $"<w:tr>{string.Concat(cells)}</w:tr>";
static string Table(params string[] rows) => $"<w:tbl>{string.Concat(rows)}</w:tbl>";
static string Tab() => "<w:r><w:tab/></w:r>";
static string Br() => "<w:r><w:br/></w:r>";
static string Sdt(string content) => $"<w:sdt><w:sdtContent>{content}</w:sdtContent></w:sdt>";
static string Textbox(string content) =>
    "<w:p><w:r><w:pict><v:shape xmlns:v=\"urn:schemas-microsoft-com:vml\">" +
    $"<v:textbox><w:txbxContent>{content}</w:txbxContent></v:textbox>" +
    "</v:shape></w:pict></w:r></w:p>";
static void Write(ZipArchive archive, string path, string content)
{
    using var writer = new StreamWriter(archive.CreateEntry(path).Open(), new UTF8Encoding(false));
    writer.Write(content);
}

async Task<string> Text(string body)
{
    using var stream = new MemoryStream();
    using (var archive = new ZipArchive(stream, ZipArchiveMode.Create, true))
    {
        Write(archive, "[Content_Types].xml",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>""" +
            """<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">""" +
            """<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>""" +
            """<Default Extension="xml" ContentType="application/xml"/>""" +
            """<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>""" +
            "</Types>");
        Write(archive, "_rels/.rels",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>""" +
            """<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">""" +
            """<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>""" +
            "</Relationships>");
        Write(archive, "word/document.xml",
            $"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>""" +
            $"""<w:document xmlns:w="{WordNamespace}"><w:body>{body}</w:body></w:document>""");
    }

    using var docx = new MemoryStream(stream.ToArray());
    var extracted = await new UploadedCvTextExtractor().ExtractAsync(docx, "cv.docx");
    return string.Join('\n', extracted
        .Split('\n')
        .Select(line => line.Trim())
        .Where(line => line.Length > 0));
}
