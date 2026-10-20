using System.Text;
using System.Text.Json;

namespace WebApp.Server.Middlewares;

/// <summary>
/// Sửa chuỗi tool-call arguments hỏng do cộng dồn TOOL_CALL_ARGS deltas
/// ("{doc1}{doc2}..."). Dùng chung cho request-sanitize (chặn 500 của
/// MapAGUIServer) và history-persist (không lưu corruption vào Redis).
/// Fail-open: mọi lỗi trả null, caller tự quyết định fallback.
/// </summary>
internal static class AguiJsonRepair
{
    public static bool IsSingleJsonDocument(string value)
    {
        try
        {
            using var _ = JsonDocument.Parse(value);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    /// <summary>
    /// Cắt chuỗi "{doc1}{doc2}..." lấy doc1 (bytes tới hết value JSON hoàn
    /// chỉnh đầu tiên). Trả null khi không có value hoàn chỉnh nào.
    /// </summary>
    public static string? ExtractFirstJsonDocument(string value)
    {
        var bytes = Encoding.UTF8.GetBytes(value);
        try
        {
            var reader = new Utf8JsonReader(bytes, isFinalBlock: true, state: default);
            if (!reader.Read())
                return null;
            reader.Skip();
            var consumed = (int)reader.BytesConsumed;
            if (consumed <= 0 || consumed >= bytes.Length)
                return null;
            var first = Encoding.UTF8.GetString(bytes, 0, consumed);
            return IsSingleJsonDocument(first) ? first : null;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    /// <summary>
    /// Chuẩn hóa arguments trước khi dùng/lưu: hợp lệ thì giữ nguyên, dính
    /// 2 JSON thì cắt lấy doc đầu, còn lại trả "{}" (parse được, fail-open).
    /// </summary>
    public static string NormalizeArguments(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return "{}";
        if (IsSingleJsonDocument(raw))
            return raw;
        return ExtractFirstJsonDocument(raw) ?? "{}";
    }
}
