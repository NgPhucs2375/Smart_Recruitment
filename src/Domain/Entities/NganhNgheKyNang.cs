using Domain.Common;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    /// <summary>
    /// Liên kết ngành nghề và kỹ năng.
    /// </summary>
    public class NganhNgheKyNang : AuditableBaseEntity
    {
        public int DanhMucNgheId { get; set; }
        public int KyNangId { get; set; }

        // ===   === //
        public DanhMucNghe DanhMucNghe { get; set; }
        public KyNang KyNang { get; set; }
    }
}
