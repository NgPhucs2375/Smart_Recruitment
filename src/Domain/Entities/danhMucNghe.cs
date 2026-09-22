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
    public class DanhMucNghe : AuditableBaseEntity
    {
        public string TenNghe { get; set; }
        public string MoTa { get; set; }
        public bool IsActive { get; set; } = true;

        // ===   === //
        public ICollection<TinTuyenDung> TinTuyenDungs { get; set;}

    }
}
