using Domain.Common;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    /// <summary>
    /// Lưu kết quả bóc tách dữ liệu CV từ module NLP.
    /// </summary>
    public class KetQuaPhanTichCv : AuditableBaseEntity
    {
        public int CVUngVienId { get; set; }
        public string NoiDungTrichXuat { get; set; }
        public string KyNangTrichXuat { get; set; }
        public string KinhNghiemTrichXuat { get; set; }
        public DateTime? NgayPhanTich { get; set; }

        // ===   === //
        public CVUngVien CVUngVien { get; set; }
    }
}
