using Domain.Common;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    /// <summary>
    /// .
    /// </summary>
    public class danhGia : AuditableBaseEntity
    {
        public int donUngTuyenId { get; set; }
        public string noiDungPhanHoi { get; set; }
        public string ketLuan { get; set; }
        public DateTime? ngayPhanHoi { get; set; }

    }
}
