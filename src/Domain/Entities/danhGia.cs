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
    public class DanhGia : AuditableBaseEntity
    {
        public int DonUngTuyenId { get; set; }
        public string NoiDungPhanHoi { get; set; }
        public string KetLuan { get; set; }
        public DateTime? NgayPhanHoi { get; set; }

        public DonUngTuyen DonUngTuyen { get; set; }

    }
}
