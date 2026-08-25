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
    public class tinTuyenDung : AuditableBaseEntity
    {
        public int doanhNghiepId { get; set; }
        public int danhMucNgheId { get; set; }
        public string tieuDe { get; set; }
        public string moTaCongViec { get; set; }
        public string kinhNghiemYeuCau { get; set; }
        public string yeuCauCongViec { get; set; }
        public string quyenLoi { get; set; }
        public string diaDiemLamViec { get; set; }
        public decimal luongToiThieu { get; set; }
        public decimal luongToiDa { get; set; }
        public TrangThaiTinTuyenDung trangThai { get; set; }
        public DateTime? ngayHetHan { get; set; }

        // ===   === //
        public doanhNghiep doanhNghieps { get; set; }
        public danhMucNghe danhMucNghes { get; set; }
        public ICollection<kyNangTinTuyenDung> kyNangTinTuyenDungs { get; set; }
        public ICollection<donUngTuyen> donUngTuyens { get; set; }

    }
}
