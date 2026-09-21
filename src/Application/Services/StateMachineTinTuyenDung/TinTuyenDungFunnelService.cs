using Domain.Entities;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Services.StateMachineTinTuyenDung
{
    /// <summary>
    /// Kết quả 1 lần chạy funnel: trigger hệ thống sẽ fire trên tin đang ở ChoDuyetHeThong
    /// kèm ghi chú giải thích (đi vào thông báo cho HR/Người đại diện).
    /// </summary>
    public sealed record KetQuaFunnel(TriggerTinTuyenDung Trigger, string Note);

    public interface ITinTuyenDungFunnelService
    {
        /// <summary>
        /// Sàng lọc tự động nội dung tin SAU khi GuiDuyet (tin đang ở ChoDuyetHeThong).
        /// Caller chịu trách nhiệm fire <see cref="KetQuaFunnel.Trigger"/> qua
        /// <see cref="TinTuyenDungStateMachine.FireSystemAsync"/> rồi SaveChanges.
        /// </summary>
        Task<KetQuaFunnel> ChayAsync(TinTuyenDung entity, CancellationToken ct = default);
    }

    /// <summary>
    /// Funnel kiểm duyệt 2 lớp (chạy đồng bộ, thuần logic — không gọi dịch vụ ngoài):
    ///   Lớp 1: luật cứng theo regex (scam/đa cấp, thu phí ứng viên, phân biệt đối xử) → HeThongTuChoi.
    ///   Lớp 2: chấm điểm an toàn 0-100 từ các tín hiệu rủi ro:
    ///          >= 85 pass → HeThongTuDongDuyet | 30-84 vùng xám → PhatHienNghiVan | &lt; 30 → HeThongTuChoi.
    /// </summary>
    public class TinTuyenDungFunnelService : ITinTuyenDungFunnelService
    {
        private const int DiemPass = 85;
        private const int DiemVungXamToiThieu = 30;

        // Lớp 1 — cụm từ cấm (so khớp trên văn bản đã bỏ dấu, 'đ' -> 'd', viết thường)
        private static readonly string[] TuCam =
        {
            // Lừa đảo / đa cấp / thu phí ứng viên
            "viec nhe luong cao",
            "dat coc",
            "phi tham gia",
            "phi giu cho",
            "phi dao tao",
            "phi ho so",
            "phi tuyen dung",
            "phi nhap hoc",
            "nop tien truoc",
            "chuyen tien truoc",
            "pyramid scheme",
            "multi level marketing",
            // Phân biệt đối xử
            "chi nhan nam",
            "chi nhan nu",
            "chi tuyen nam",
            "chi tuyen nu",
            "khong nhan nam",
            "khong nhan nu",
            "khong tuyen nam",
            "khong tuyen nu",
            "khong tuyen phu nu"
        };

        // Lớp 2 — tín hiệu từ khóa: (cụm từ, điểm trừ)
        private static readonly (string Tu, int Tru)[] TinHieuTuKhoa =
        {
            ("thu nhap khong gioi han", 25),
            ("co hoi lam giau", 25),
            ("kiem tien nhanh", 25),
            ("kiem tien online", 25),
            ("khong can hop dong", 15),
            ("khong can cv", 15),
            ("nhan tien ngay", 15),
            ("tra tien ngay", 15)
        };

        private static readonly Regex SoDienThoai = new(@"(?:\+?84|0)(?:[\s.\-]?\d){8,10}", RegexOptions.Compiled);
        private static readonly Regex EmailLienHe = new(@"[\w.+-]+@[\w-]+\.[\w.-]+", RegexOptions.Compiled);

        public Task<KetQuaFunnel> ChayAsync(TinTuyenDung entity, CancellationToken ct = default)
        {
            string vanBan = ChuanHoa(string.Join(" ",
                entity.TieuDe, entity.MoTaCongViec, entity.YeuCauCongViec,
                entity.KinhNghiemYeuCau, entity.QuyenLoi, entity.DiaDiemLamViec));

            // ── Lớp 1: luật cứng ──
            var tuBat = TuCam.Where(t => vanBan.Contains(t, StringComparison.Ordinal)).ToList();
            if (tuBat.Count > 0)
            {
                string lietKe = string.Join(", ", tuBat.Select(t => $"'{t}'"));
                return Task.FromResult(new KetQuaFunnel(
                    TriggerTinTuyenDung.HeThongTuChoi,
                    $"Lớp 1 vi phạm luật cứng — cụm từ cấm: {lietKe}."));
            }

            // ── Lớp 2: chấm điểm an toàn ──
            var tinHieu = new List<(string MoTa, int Tru)>();

            if (SoDienThoai.IsMatch(vanBan)
                || vanBan.Contains("zalo", StringComparison.Ordinal)
                || vanBan.Contains("telegram", StringComparison.Ordinal)
                || vanBan.Contains("whatsapp", StringComparison.Ordinal)
                || EmailLienHe.IsMatch(vanBan))
            {
                tinHieu.Add(("đưa thông tin liên hệ cá nhân vào nội dung (đi ngoài kênh hệ thống)", 20));
            }

            if (entity.LuongToiThieu <= 0 && entity.LuongToiDa <= 0)
            {
                tinHieu.Add(("chưa khai báo khoảng lương", 10));
            }

            if (vanBan.Length < 300)
            {
                tinHieu.Add(("nội dung quá ngắn, thiếu chi tiết công việc", 15));
            }

            foreach (var (tu, tru) in TinHieuTuKhoa)
            {
                if (vanBan.Contains(tu, StringComparison.Ordinal))
                {
                    tinHieu.Add(($"cam kết thu nhập/thủ tục phi thực tế: '{tu}'", tru));
                }
            }

            int diem = Math.Max(0, 100 - tinHieu.Sum(t => t.Tru));

            if (diem >= DiemPass)
            {
                string chiTiet = tinHieu.Count == 0
                    ? "không có tín hiệu rủi ro đáng kể."
                    : "tín hiệu nhỏ: " + LietKeTinHieu(tinHieu);
                return Task.FromResult(new KetQuaFunnel(
                    TriggerTinTuyenDung.HeThongTuDongDuyet,
                    $"Lớp 1 đạt; Lớp 2 điểm an toàn {diem}/100 — {chiTiet}"));
            }

            string danhSach = LietKeTinHieu(tinHieu);
            if (diem >= DiemVungXamToiThieu)
            {
                return Task.FromResult(new KetQuaFunnel(
                    TriggerTinTuyenDung.PhatHienNghiVan,
                    $"Lớp 1 đạt; Lớp 2 điểm an toàn {diem}/100 (vùng xám) — {danhSach}. Chuyển Admin kiểm tra."));
            }

            return Task.FromResult(new KetQuaFunnel(
                TriggerTinTuyenDung.HeThongTuChoi,
                $"Lớp 1 đạt nhưng Lớp 2 điểm an toàn quá thấp ({diem}/100) — {danhSach}."));
        }

        private static string LietKeTinHieu(List<(string MoTa, int Tru)> tinHieu)
            => string.Join("; ", tinHieu.Select(t => $"{t.MoTa} (-{t.Tru})"));

        /// <summary>
        /// Chuẩn hóa văn bản để so khớp: viết thường, bỏ dấu tiếng Việt,
        /// map 'đ' -> 'd', gom khoảng trắng về 1 dấu cách.
        /// </summary>
        private static string ChuanHoa(string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;

            string formD = input.ToLowerInvariant().Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder(formD.Length);
            foreach (char ch in formD)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(ch) == UnicodeCategory.NonSpacingMark) continue;
                if (char.IsWhiteSpace(ch)) { sb.Append(' '); continue; }
                sb.Append(ch == 'đ' ? 'd' : ch);
            }

            return Regex.Replace(sb.ToString().Normalize(NormalizationForm.FormC), @"\s+", " ").Trim();
        }
    }
}
