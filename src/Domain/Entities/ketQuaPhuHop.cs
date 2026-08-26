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
        public float DiemPhuHop { get; set; }
        public PhanLoaiKetQua PhanLoai { get; set; }
        public DateTime? NgayDanhGia { get; set; }

        // ===   === //
        public HoSoUngVien HoSoUngVien { get; set; }
        public TinTuyenDung TinTuyenDung { get; set; }

    }
}
