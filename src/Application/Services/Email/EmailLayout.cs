#nullable enable
using System.Text;

namespace Application.Services.Email;

/// <summary>Sắc thái email: quyết định màu nhãn trạng thái, viền ghi chú và nút hành động.</summary>
public enum EmailTone
{
    Info,
    Success,
    Warning,
    Danger
}

/// <summary>
/// Nội dung một email hệ thống dưới dạng text thuần. <see cref="EmailLayout.Render"/> tự
/// escape nên nơi gọi không cần (và không được) chèn HTML vào các trường này.
/// </summary>
public sealed class EmailLayoutModel
{
    public string Title { get; init; } = string.Empty;
    public string Badge { get; init; } = string.Empty;
    public EmailTone Tone { get; init; } = EmailTone.Info;
    public string? Greeting { get; init; }
    public IReadOnlyList<string> Paragraphs { get; init; } = Array.Empty<string>();
    public IReadOnlyList<KeyValuePair<string, string>> Fields { get; init; } = Array.Empty<KeyValuePair<string, string>>();
    public string? Note { get; init; }
    public string? CtaText { get; init; }
    public string? CtaUrl { get; init; }
    public string? Footer { get; init; }
}

/// <summary>
/// Khung HTML dùng chung cho mọi email hệ thống: thẻ HIREAI, tiêu đề + nhãn trạng thái,
/// bảng thông tin, khối ghi chú, nút hành động và chân thư. Bố cục dùng bảng + style
/// inline vì Gmail/Outlook bỏ qua &lt;style&gt; và flex/grid.
/// </summary>
public static class EmailLayout
{
    private const string Brand = "#355c8c";
    private const string Ink = "#1a2433";
    private const string Muted = "#6b7684";
    private const string Body = "#44566c";
    private const string Line = "#e1e7ee";
    private const string Divider = "#eef1f5";

    public static string Render(EmailLayoutModel model)
    {
        var (toneFg, toneBg) = ToneColors(model.Tone);
        var html = new StringBuilder(4096);

        html.Append("<!DOCTYPE html><html lang=\"vi\"><head><meta charset=\"utf-8\" />");
        html.Append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />");
        html.Append("<title>").Append(Text(model.Title)).Append("</title></head>");
        html.Append("<body style=\"margin:0;padding:0;background:#eef1f5;")
            .Append("font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:").Append(Ink).Append(";\">");
        html.Append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" ")
            .Append("style=\"background:#eef1f5;padding:28px 12px;\"><tr><td align=\"center\">");
        html.Append("<table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" ")
            .Append("style=\"width:100%;max-width:600px;background:#ffffff;border:1px solid ").Append(Line)
            .Append(";border-radius:12px;overflow:hidden;\">");

        // Thẻ thương hiệu
        html.Append("<tr><td style=\"background:").Append(Brand).Append(";padding:20px 28px;\">")
            .Append("<div style=\"font-size:17px;font-weight:700;letter-spacing:3px;color:#ffffff;\">HIREAI</div>")
            .Append("<div style=\"margin-top:2px;font-size:12px;color:#c9d8e8;letter-spacing:.3px;\">")
            .Append("Nền tảng tuyển dụng thông minh</div></td></tr>");

        // Tiêu đề + nhãn trạng thái
        html.Append("<tr><td style=\"padding:28px 28px 0;\"><table role=\"presentation\" width=\"100%\" ")
            .Append("cellpadding=\"0\" cellspacing=\"0\"><tr>")
            .Append("<td style=\"font-size:20px;font-weight:700;line-height:1.35;color:").Append(Ink).Append(";\">")
            .Append(Text(model.Title)).Append("</td>");
        if (!string.IsNullOrWhiteSpace(model.Badge))
        {
            html.Append("<td align=\"right\" style=\"padding-left:12px;white-space:nowrap;\">")
                .Append("<span style=\"display:inline-block;padding:4px 10px;border-radius:999px;")
                .Append("font-size:11px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;")
                .Append("color:").Append(toneFg).Append(";background:").Append(toneBg).Append(";\">")
                .Append(Text(model.Badge)).Append("</span></td>");
        }
        html.Append("</tr></table></td></tr>");

        // Thân thư
        html.Append("<tr><td style=\"padding:16px 28px 28px;\">");

        if (!string.IsNullOrWhiteSpace(model.Greeting))
            html.Append("<p style=\"margin:0 0 10px;font-size:14px;line-height:1.65;color:").Append(Ink)
                .Append(";font-weight:600;\">").Append(Text(model.Greeting)).Append("</p>");

        foreach (var paragraph in model.Paragraphs.Where(x => !string.IsNullOrWhiteSpace(x)))
            html.Append("<p style=\"margin:0 0 10px;font-size:14px;line-height:1.7;color:").Append(Body).Append(";\">")
                .Append(Text(paragraph)).Append("</p>");

        var fields = model.Fields.Where(x => !string.IsNullOrWhiteSpace(x.Value)).ToList();
        if (fields.Count > 0)
        {
            html.Append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" ")
                .Append("style=\"margin:16px 0 4px;border-top:1px solid ").Append(Divider).Append(";\">");
            foreach (var field in fields)
            {
                html.Append("<tr>")
                    .Append("<td style=\"padding:10px 12px 10px 0;width:40%;vertical-align:top;font-size:11px;")
                    .Append("text-transform:uppercase;letter-spacing:.5px;color:").Append(Muted).Append(";")
                    .Append("border-bottom:1px solid ").Append(Divider).Append(";\">")
                    .Append(Text(field.Key)).Append("</td>")
                    .Append("<td style=\"padding:10px 0;font-size:14px;font-weight:600;color:").Append(Ink).Append(";")
                    .Append("border-bottom:1px solid ").Append(Divider).Append(";\">")
                    .Append(Text(field.Value)).Append("</td></tr>");
            }
            html.Append("</table>");
        }

        if (!string.IsNullOrWhiteSpace(model.Note))
        {
            html.Append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" ")
                .Append("style=\"margin:18px 0 0;background:#f7f9fb;border-left:3px solid ").Append(toneFg)
                .Append(";border-radius:6px;\"><tr><td style=\"padding:12px 14px;font-size:13px;line-height:1.65;color:")
                .Append(Body).Append(";\"><strong style=\"color:").Append(Ink).Append(";\">Ghi chú:</strong> ")
                .Append(Lines(model.Note)).Append("</td></tr></table>");
        }

        if (!string.IsNullOrWhiteSpace(model.CtaText) && !string.IsNullOrWhiteSpace(model.CtaUrl))
        {
            var url = Attribute(model.CtaUrl);
            html.Append("<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:22px 0 0;\">")
                .Append("<tr><td style=\"background:").Append(Brand).Append(";border-radius:8px;\">")
                .Append("<a href=\"").Append(url).Append("\" target=\"_blank\" ")
                .Append("style=\"display:inline-block;padding:12px 26px;font-size:14px;font-weight:600;")
                .Append("color:#ffffff;text-decoration:none;\">").Append(Text(model.CtaText)).Append("</a>")
                .Append("</td></tr></table>");
            html.Append("<p style=\"margin:14px 0 0;font-size:12px;line-height:1.6;color:#8a94a6;\">")
                .Append("Nếu nút không hoạt động, mở liên kết sau: ")
                .Append("<a href=\"").Append(url).Append("\" target=\"_blank\" ")
                .Append("style=\"color:").Append(Brand).Append(";word-break:break-all;\">")
                .Append(Text(model.CtaUrl)).Append("</a></p>");
        }

        if (!string.IsNullOrWhiteSpace(model.Footer))
            html.Append("<p style=\"margin:18px 0 0;font-size:13px;line-height:1.65;color:").Append(Muted).Append(";\">")
                .Append(Text(model.Footer)).Append("</p>");

        html.Append("</td></tr></table>");

        // Chân thư ngoài thẻ
        html.Append("<div style=\"max-width:600px;margin:14px auto 0;font-size:12px;line-height:1.6;color:#98a2b3;text-align:center;\">")
            .Append("Email tự động từ HIREAI, vui lòng không trả lời email này.<br />")
            .Append("Bạn nhận được email vì có tài khoản hoặc giao dịch trên HIREAI.</div>");
        html.Append("</td></tr></table></body></html>");

        return html.ToString();
    }

    private static (string Foreground, string Background) ToneColors(EmailTone tone) => tone switch
    {
        EmailTone.Success => ("#1b7f4b", "#e7f5ed"),
        EmailTone.Warning => ("#8a5a00", "#fdf3df"),
        EmailTone.Danger => ("#b3261e", "#fdecea"),
        _ => (Brand, "#eaf1f9")
    };

    // Escape thủ công thay vì WebUtility.HtmlEncode: bản của .NET đổi mọi ký tự tiếng Việt
    // thành entity số (ph&#249;), thư vẫn hiển thị đúng nhưng khó đọc và phình dung lượng.
    private static string Text(string? value) => Encode(value);

    private static string Lines(string? value) => Encode(value).Replace("\n", "<br />");

    private static string Attribute(string value) => Encode(value);

    private static string Encode(string? value)
    {
        if (string.IsNullOrEmpty(value)) return string.Empty;
        var escaped = new StringBuilder(value.Length + 16);
        foreach (var ch in value)
        {
            switch (ch)
            {
                case '&': escaped.Append("&amp;"); break;
                case '<': escaped.Append("&lt;"); break;
                case '>': escaped.Append("&gt;"); break;
                case '"': escaped.Append("&quot;"); break;
                case '\'': escaped.Append("&#39;"); break;
                default: escaped.Append(ch); break;
            }
        }
        return escaped.ToString();
    }
}
