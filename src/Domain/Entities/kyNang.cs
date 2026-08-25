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
    public class kyNang : AuditableBaseEntity
    {
        public string tenKyNang { get; set; }
        public string moTa { get; set; }

        // ===   === //
        public ICollection<kyNangUngVien> kyNangUngViens { get; set; }
        public ICollection<kyNangTinTuyenDung> kyNangTinTuyenDungs { get; set; }
    }
}
