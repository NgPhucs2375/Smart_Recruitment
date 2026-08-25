using Domain.Common;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    /// <summary>
    /// Danh mục ngành nghề phục vụ phân loại và tìm kiếm.
    /// </summary>
    public class danhMucNghe : AuditableBaseEntity
    {
        public string tenNghe { get; set; }
        public string moTa { get; set; }

        // ===   === //
        public ICollection<tinTuyenDung> tinTuyenDungs { get; set;}

    }
}
