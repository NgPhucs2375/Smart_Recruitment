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
    public class thongBao : AuditableBaseEntity
    {
        public int nguoiDungId { get; set; }
        public string tieuDe { get; set; }
        public string noiDung { get; set; }
        public LoaiThongBao loaiThongBao { get; set; }
        public bool Is_Read { get; set; } = false;

        // ===   === //
        public nguoiDung nguoiDungs { get; set; }
    }
}
