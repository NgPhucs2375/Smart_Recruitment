using Domain.Common;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    /// <summary>
    /// Liên kết kỹ năng và tin tuyển dụng.
    /// </summary>
    public class KyNangTinTuyenDung : AuditableBaseEntity
    {
        public int TinTuyenDungId { get; set; }
        public int KyNangId { get; set; }
        public string MucDoYeuCau { get; set; }

        // ===   === //
        public TinTuyenDung TinTuyenDung { get; set; }
        public KyNang KyNang { get; set; }
    }
}
