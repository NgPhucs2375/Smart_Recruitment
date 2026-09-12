using Domain.Common;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    /// <summary>
    /// Lưu điểm số và đánh giá mức độ phù hợp giữa CV/Ứng viên với Tin tuyển dụng từ ML & Content-Based Filtering.
    /// </summary>
    public class KetQuaPhuHop : AuditableBaseEntity
    {
        public int HoSoUngVienId { get; set; }
        public int TinTuyenDungId { get; set; }
        public float DiemPhuHop { get; set; } // consine similarity 
        public string KyNangThoa { get; set; }
        public string KyNangThieu { get; set; }
        public PhanLoaiKetQua PhanLoai { get; set; }
        public string GhiChu { get; set; } // ghi chú , phân tích của Agent 
        public int? CVUngVienId { get; set; }
        public string CvSemanticHash { get; set; }
        public string JobSemanticHash { get; set; }
        public string MatchingVersion { get; set; }
        public string ExplanationModel { get; set; }
        public DateTime EvaluateAt { get; set; }
        // ===   === //
        public HoSoUngVien HoSoUngVien { get; set; }
        public TinTuyenDung TinTuyenDung { get; set; }

    }
}
