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
    public class HoSoUngVien : AuditableBaseEntity
    {
        public int NguoiDungId { get; set; }
        public string HoTen { get; set; }
        public string SDT { get; set; }
        public DateTime? NgaySinh { get; set; }
        public string GioiTinh { get; set; }
        public string DiaChi { get; set; }
        public string GioiThieu { get; set; }
        public string ViTriUngTuyen { get; set; }
        public double MucLuongMongMuon { get; set; }
        public bool IsTimViec { get; set; } = true;

        // ===   === //
        public NguoiDung NguoiDung { get; set; }
        public ICollection<CVUngVien> CVUngViens { get; set; }
        public ICollection<KetQuaPhuHop> KetQuaPhuHops { get; set; }
    }
}
