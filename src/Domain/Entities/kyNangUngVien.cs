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
    public class KyNangUngVien : AuditableBaseEntity
    {
        public int HoSoUngVienId { get; set; }
        public int KyNangId { get; set; }
        public float? SoNamKinhNghiem { get; set; }
        public MucDo MucDoThongThao {get; set;}

        // ===   === //
        public HoSoUngVien HoSoUngVien { get; set; }
        public KyNang KyNang { get; set; }
    }
}
