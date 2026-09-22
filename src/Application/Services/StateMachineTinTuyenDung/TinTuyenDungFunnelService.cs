using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
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
    ///   Lớp 1: từ khóa cấm do Admin cấu hình → HeThongTuChoi.
    ///   Lớp 2: chấm điểm an toàn 0-100 từ các tín hiệu rủi ro:
    ///          >= 85 pass → HeThongTuDongDuyet | 30-84 vùng xám → PhatHienNghiVan | &lt; 30 → HeThongTuChoi.
    /// </summary>
    public class TinTuyenDungFunnelService : ITinTuyenDungFunnelService
    {
        private const int DiemPass = 85;
        private const int DiemVungXamToiThieu = 30;

        private static readonly Regex SoDienThoai = new(@"(?:\+?84|0)(?:[\s.\-]?\d){8,10}", RegexOptions.Compiled);
        private static readonly Regex EmailLienHe = new(@"[\w.+-]+@[\w-]+\.[\w.-]+", RegexOptions.Compiled);

        private readonly IApplicationDbContext _context;

        public TinTuyenDungFunnelService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<KetQuaFunnel> ChayAsync(TinTuyenDung entity, CancellationToken ct = default)
        {
            string vanBan = ChuanHoa(string.Join(" ",
                entity.TieuDe, entity.MoTaCongViec, entity.YeuCauCongViec,
                entity.KinhNghiemYeuCau, entity.QuyenLoi, entity.DiaDiemLamViec));

            var quyTacs = await _context.QuyTacKiemDuyetTins
                .AsNoTracking()
                .Where(x => x.IsActive)
                .ToListAsync(ct);

            // ── Lớp 1: luật cứng ──
            var tuBat = quyTacs
                .Where(x => x.Loai == LoaiQuyTacKiemDuyet.TuKhoaCam)
                .Where(x => vanBan.Contains(ChuanHoa(x.TuKhoa), StringComparison.Ordinal))
                .Select(x => x.TuKhoa)
                .ToList();
            if (tuBat.Count > 0)
            {
                string lietKe = string.Join(", ", tuBat.Select(t => $"'{t}'"));
                return new KetQuaFunnel(
                    TriggerTinTuyenDung.HeThongTuChoi,
                    $"Lớp 1 vi phạm luật cứng — cụm từ cấm: {lietKe}.");
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

            foreach (var rule in quyTacs.Where(x => x.Loai == LoaiQuyTacKiemDuyet.TinHieuRuiRo))
            {
                var tu = ChuanHoa(rule.TuKhoa);
                if (vanBan.Contains(tu, StringComparison.Ordinal))
                {
                    tinHieu.Add(($"{rule.MoTa ?? "tín hiệu rủi ro"}: '{rule.TuKhoa}'", rule.DiemTru));
                }
            }

            int diem = Math.Max(0, 100 - tinHieu.Sum(t => t.Tru));

            if (diem >= DiemPass)
            {
                string chiTiet = tinHieu.Count == 0
                    ? "không có tín hiệu rủi ro đáng kể."
                    : "tín hiệu nhỏ: " + LietKeTinHieu(tinHieu);
                var vaiTroNguoiDang = await _context.NguoiDungs
                    .AsNoTracking()
                    .Where(x => x.Id == entity.NguoiDangTinId)
                    .Select(x => x.VaiTro)
                    .FirstOrDefaultAsync(ct);
                var trigger = vaiTroNguoiDang == VaiTroNguoiDung.NHAN_SU
                    ? TriggerTinTuyenDung.HeThongDuyetChoNguoiDaiDien
                    : TriggerTinTuyenDung.HeThongTuDongDuyet;
                return new KetQuaFunnel(
                    trigger,
                    $"Lớp 1 đạt; Lớp 2 điểm an toàn {diem}/100 — {chiTiet}");
            }

            string danhSach = LietKeTinHieu(tinHieu);
            if (diem >= DiemVungXamToiThieu)
            {
                return new KetQuaFunnel(
                    TriggerTinTuyenDung.PhatHienNghiVan,
                    $"Lớp 1 đạt; Lớp 2 điểm an toàn {diem}/100 (vùng xám) — {danhSach}. Chuyển Admin kiểm tra.");
            }

            return new KetQuaFunnel(
                TriggerTinTuyenDung.HeThongTuChoi,
                $"Lớp 1 đạt nhưng Lớp 2 điểm an toàn quá thấp ({diem}/100) — {danhSach}.");
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
