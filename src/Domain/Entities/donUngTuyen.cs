using Domain.Common;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    /// <summary>
    /// Ghi nhận việc ứng viên nộp hồ sơ vào tin tuyển dụng và theo dõi trạng thái.
    /// </summary>
    public class DonUngTuyen : AuditableBaseEntity
    {
        public int TinTuyenDungId { get; set; }
        public int CVUngVienId { get; set; }
        public int NguoiXuLyId { get; set; } // HR noaf laf nguoi duyet don
        public string GhiChu { get; set; } // lis docuye choi 
        public TrangThaiDonUngTuyen TrangThai { get; set; }
        public DateTime? NgayUngTuyen { get; set; }

        // ===   === //
        public TinTuyenDung TinTuyenDung { get; set; }
        public CVUngVien CVUngVien { get; set; }
        public ICollection<DanhGia> DanhGias { get; set; }
    }
}
