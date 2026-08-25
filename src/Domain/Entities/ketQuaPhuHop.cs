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
    public class ketQuaPhuHop : AuditableBaseEntity
    {
        public int hoSoUngVienId { get; set; }
        public int tinTuyenDungId { get; set; }
        public float diemPhuHop { get; set; }
        public PhanLoaiKetQua phanLoai { get; set; }
        public DateTime? ngayDanhGia { get; set; }

        // ===   === //
        public hoSoUngVien hoSoUngViens { get; set; }
        public tinTuyenDung tinTuyenDungs { get; set; }

    }
}
