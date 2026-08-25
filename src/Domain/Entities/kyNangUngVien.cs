using Domain.Common;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    /// <summary>
    /// Liên kết giữ ứng viên và danh mục kỹ năng của họ.
    /// </summary>
    public class kyNangUngVien : AuditableBaseEntity
    {
        public int hoSoUngVienId { get; set; }
        public int kyNangId { get; set; }
        public float? soNamKinhNghiem { get; set; }

        // ===   === //
        public hoSoUngVien hoSoUngViens { get; set; }
        public kyNang kyNangs { get; set; }
    }
}
