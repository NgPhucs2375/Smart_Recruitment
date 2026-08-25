using Domain.Common;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    /// <summary>
    /// Lưu tệp CV và thông tin quản lý CV của ứng viên.
    /// </summary>
    public class cvUngVien : AuditableBaseEntity
    {
        public int hoSoUngVienId { get; set; }
        public string tenFile { get; set; }
        public string fileUrl { get; set; }
        public DateTime? ngayUpload { get; set; }
        public Boolean is_Default { get; set; } = true;

        // ===   === //
        public hoSoUngVien hoSoUngViens { get; set; }
        public ICollection<ketQuaPhanTichCv> ketQuaPhanTichCvs { get; set; }

    }
}
