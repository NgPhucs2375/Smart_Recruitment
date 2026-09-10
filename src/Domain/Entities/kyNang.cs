using Domain.Common;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    /// <summary>
    /// Danh mục kỹ năng chuan hoa.
    /// </summary>
    public class KyNang : AuditableBaseEntity
    {
        public string TenKyNang { get; set; }
        public string MoTa { get; set; }

        // ===   === //
        public ICollection<KyNangUngVien> KyNangUngViens { get; set; }
        public ICollection<KyNangTinTuyenDung> KyNangTinTuyenDungs { get; set; }
    }
}
