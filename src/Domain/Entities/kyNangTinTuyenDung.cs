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
    public class kyNangTinTuyenDung : AuditableBaseEntity
    {
        public int tinTuyenDungId { get; set; }
        public int kyNangId { get; set; }
        public string mucDoYeuCau { get; set; }

        // ===   === //
        public tinTuyenDung tinTuyenDungs { get; set; }
        public kyNang kyNangs { get; set; }
    }
}
