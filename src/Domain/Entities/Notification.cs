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
    public class Notification : AuditableBaseEntity
    {
        public string TieuDe { get; set; }
        public string NoiDung { get; set; }
        public LoaiThongBao LoaiThongBao { get; set; }
        public string? ReferenceType { get; set; }
        public int? ReferenceId { get; set; }

        public ICollection<NotificationRecipient> Recipients { get; set; } = new List<NotificationRecipient>();
    }
}
