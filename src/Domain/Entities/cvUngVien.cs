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
    public class CVUngVien : AuditableBaseEntity
    {
        public int HoSoUngVienId { get; set; }
        public string TenFile { get; set; }
        public string FileUrl { get; set; }
        public DateTime? NgayUpload { get; set; }
        public bool IsDefault { get; set; } = true;
        public PhuongThucTaoCV PhuongThucTaoCV { get; set; } 
        public TrangThaiTienTrinhCV TrangThaiTienTrinhCV { get; set; } = TrangThaiTienTrinhCV.KhoiTaoMoi;
        public TrangThaiCV TrangThaiCV { get; set; }  = TrangThaiCV.DangXuLy;
        public string LoiChiTiet { get; set; }

        // ===   === //
        public HoSoUngVien HoSoUngVien { get; set; }
        public ICollection<KetQuaPhanTichCv> KetQuaPhanTichCvs { get; set; }

    }
}
