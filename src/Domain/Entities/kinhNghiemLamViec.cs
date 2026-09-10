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
    public class KinhNghiemLamViec : AuditableBaseEntity
    {
        public int HoSoUngVienId { get; set; }
        public string TenCongTy { get; set; }
        public string DiaChi { get; set; }
        public DateTime? TuNgay { get; set; }
        public DateTime? DenNgay { get; set; }
        public string MoTa { get; set; }
        public bool IsHienTai { get; set; }

        // ===   === //
        public HoSoUngVien HoSoUngVien { get; set; }
    }
}
