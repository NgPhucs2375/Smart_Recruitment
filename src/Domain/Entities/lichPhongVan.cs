using Domain.Common;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    /// <summary>
    /// Lưu lịch phỏng vấn trao đổi giữa Nhà tuyển dụng và Ứng viên.
    /// </summary>
    public class LichPhongVan : AuditableBaseEntity
    {
        public int DonUngTuyenId { get; set; }
        public string DiaDiem { get; set; }
        public string GhiChu { get; set; }
        public DateTime? ThoiGianPhongVan { get; set; }
        public TrangThaiLichPhongVan TrangThai { get; set; }

        // ===   === //
        public DonUngTuyen DonUngTuyen { get; set; }

    }
}
