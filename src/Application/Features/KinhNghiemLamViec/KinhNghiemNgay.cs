#nullable enable

using System.Globalization;

namespace Application.Features.KinhNghiemLamViec
{
    /// <summary>
    /// Ngày kinh nghiệm đến từ FE dưới dạng chuỗi rỗng khi người dùng bỏ trống ô
    /// (web và mobile đều gửi ""), nên ép kiểu thẳng vào DateTime? sẽ bị JSON binding
    /// chặn trước khi validator chạy. Vì vậy tầng Application giữ nguyên chuỗi và parse ở đây.
    /// </summary>
    internal static class KinhNghiemNgay
    {
        private static readonly string[] Formats =
        {
            "yyyy-MM-dd",
            "dd/MM/yyyy",
            "yyyy-MM-ddTHH:mm:ss",
        };

        public static bool TryParse(string? value, out DateTime? date)
        {
            date = null;

            if (string.IsNullOrWhiteSpace(value))
            {
                return true;
            }

            var text = value.Trim();

            if (DateTime.TryParseExact(text, Formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
            {
                date = parsed.Date;
                return true;
            }

            if (DateTime.TryParse(text, CultureInfo.InvariantCulture, DateTimeStyles.None, out var fallback))
            {
                date = fallback.Date;
                return true;
            }

            return false;
        }

        public static bool CanBeParsed(string? value) => TryParse(value, out _);
    }
}
