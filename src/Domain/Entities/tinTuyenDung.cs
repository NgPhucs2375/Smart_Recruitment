using Domain.Common;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    /// <summary>
    /// Thông tin công việc/tin tuyen dung.
    /// </summary>
    public class TinTuyenDung : AuditableBaseEntity
    {
        public int DoanhNghiepId { get; set; }
        public int DanhMucNgheId { get; set; }
        public int NguoiDangTinId { get; set; }
        public string TieuDe { get; set; }
        public string MoTaCongViec { get; set; }
        public string KinhNghiemYeuCau { get; set; }
        public string YeuCauCongViec { get; set; }
        public string QuyenLoi { get; set; }
        public string DiaDiemLamViec { get; set; }
        public decimal LuongToiThieu { get; set; }
        public decimal LuongToiDa { get; set; }
        public TrangThaiTinTuyenDung TrangThai { get; set; }
        public DateTime? NgayHetHan { get; set; }

        // ===   === //
        public DoanhNghiep DoanhNghiep { get; set; }
        public DanhMucNghe DanhMucNghe { get; set; }
        public NguoiDung NguoiDangTin { get; set; }
        public ICollection<KyNangTinTuyenDung> KyNangTinTuyenDungs { get; set; }
        public ICollection<DonUngTuyen> DonUngTuyens { get; set; }

    }
}
