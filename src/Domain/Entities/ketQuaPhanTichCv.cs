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
    public class ketQuaPhanTichCv : AuditableBaseEntity
    {
        public int cvUngVienId { get; set; }
        public string noiDungTrichXuat { get; set; }
        public string kyNangTrichXuat { get; set; }
        public string kinhNghiemTrichXuat { get; set; }
        public DateTime? ngayPhanTich { get; set; }

        // ===   === //
        public cvUngVien cvUngViens { get; set; }
    }
}
