using Domain.Common;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    /// <summary>
    /// Lưu các thông báo hệ thống phục vụ hiển thị trên Web và Mobile App.
    /// </summary>
    public class ThongBao : AuditableBaseEntity
    {
        public int NguoiDungId { get; set; }
        public string TieuDe { get; set; }
        public string NoiDung { get; set; }
        public LoaiThongBao LoaiThongBao { get; set; }
        public bool IsRead { get; set; } = false;

        // ===   === //
        public NguoiDung NguoiDung { get; set; }
    }
}
