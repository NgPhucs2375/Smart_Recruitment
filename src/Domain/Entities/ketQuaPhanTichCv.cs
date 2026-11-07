using Domain.Common;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    /// <summary>
    /// Lưu kết quả bóc tách dữ liệu CV từ module NLP.
    /// </summary>
    public class KetQuaPhanTichCv : AuditableBaseEntity
    {
        public int CVUngVienId { get; set; }

        public string? NoiDungTrichXuat { get; set; }

        public string? KyNangTrichXuat { get; set; }

        public string? KinhNghiemTrichXuat { get; set; }

        public string? HocVanTrichXuat { get; set; }

        public TrangThaiPhanTichAgent PhanTich { get; set; }

        // === Kết quả đánh giá CV theo một tin tuyển dụng (AI agent) ===

        /// <summary>Điểm chất lượng CV 0..100 do agent chấm; null = chưa đánh giá.</summary>
        public int? DiemTongQuan { get; set; }

        /// <summary>Điểm khớp CV với tin 0..1 do scorer tất định tính.</summary>
        public float? DiemPhuHop { get; set; }

        /// <summary>Phiên bản scorer dùng khi chấm, ví dụ cbf-v7-idf.</summary>
        public string? MatchingVersion { get; set; }

        /// <summary>Tin tuyển dụng mà CV được đánh giá cùng.</summary>
        public int? TinTuyenDungId { get; set; }

        /// <summary>Nhận xét tổng quan 2-4 câu.</summary>
        public string? NhanXet { get; set; }

        /// <summary>Điểm mạnh, mỗi dòng một ý.</summary>
        public string? DiemManh { get; set; }

        /// <summary>Điểm cần cải thiện, mỗi dòng một ý.</summary>
        public string? DiemYeu { get; set; }

        /// <summary>Gợi ý hành động, mỗi dòng dạng "phan|viec".</summary>
        public string? GoiY { get; set; }

        public DateTime? DanhGiaLuc { get; set; }

        /// <summary>false = kết quả fallback theo luật vì agent không trả được JSON.</summary>
        public bool DaDanhGiaBangAi { get; set; }

        public TinTuyenDung? TinTuyenDung { get; set; }

        public CVUngVien CVUngVien { get; set; }
    }
}
