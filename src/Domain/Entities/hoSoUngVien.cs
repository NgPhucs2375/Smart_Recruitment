using Domain.Common;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    /// <summary>
    /// Thông tin hồ sơ cá nhân ứng viên.
    /// </summary>
    public class hoSoUngVien : AuditableBaseEntity
    {
        public int nguoiDungId { get; set; }
        public string hoTen { get; set; }
        public string SDT { get; set; }
        public DateTime? ngaySinh { get; set; }
        public string gioiTinh { get; set; }
        public string diaChi { get; set; }
        public string gioiThieu { get; set; }

        // ===   === //
        public nguoiDung nguoiDungs { get; set; }
        public ICollection<kyNangUngVien> kyNangUngViens { get; set; }
        public ICollection<cvUngVien> cvUngViens { get; set; }
        public ICollection<donUngTuyen> donUngTuyens { get; set; }
    }
}
