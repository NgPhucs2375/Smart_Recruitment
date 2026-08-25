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
    public class donUngTuyen : AuditableBaseEntity
    {
        public int hoSoUngVienId { get; set; }
        public int tinTuyenDungId { get; set; }
        public int cvUngVienId { get; set; }
        public TrangThaiDonUngTuyen trangThai { get; set; }
        public DateTime? ngayUngTuyen { get; set; }

        // ===   === //
        public hoSoUngVien hoSoUngViens { get; set; }
        public tinTuyenDung tinTuyenDungs { get; set; }
        public cvUngVien cvUngViens { get; set; }
        public ICollection<lichPhongVan> lichPhongVans { get; set; }
    }
}
