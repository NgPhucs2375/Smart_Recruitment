using Domain.Common;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    /// <summary>
    /// 
    /// </summary>
    public class kinhNghiemLamViec : AuditableBaseEntity
    {
        public int hoSoUngVienId { get; set; }
        public string tenCongTy { get; set; }
        public string diaChi { get; set; }
        public DateTime? tuNgay { get; set; }
        public DateTime? denNgay { get; set; }
        public string moTa { get; set; }
        public bool IsHienTai { get; set; }

        // ===   === //
        public hoSoUngVien hoSoUngViens { get; set; }
    }
}
