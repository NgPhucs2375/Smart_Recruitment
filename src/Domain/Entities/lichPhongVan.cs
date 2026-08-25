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
    public class lichPhongVan : AuditableBaseEntity
    {
        public int donUngTuyenId { get; set; }
        public string diaDiem { get; set; }
        public string ghiChu { get; set; }
        public DateTime? thoiGianPhongVan { get; set; }
        public TrangThaiLichPhongVan trangThai { get; set; }

        // ===   === //
        public donUngTuyen donUngTuyens { get; set; }

    }
}
