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
        // FILE
        public string TenFile { get; set; }
        public string FileUrl { get; set; }
        // CV
        public string TemplateId { get; set; }
        public PhuongThucTaoCV PhuongThucTao { get; set; }

        public bool IsDefault { get; set; } = true;

        public bool IsDaXoa { get; set; } = false;


        

        // ===   === //
    public HoSoUngVien HoSoUngVien { get; set; }

        public CVThongTinLienHe ThongTinLienHe { get; set; }

        public ICollection<CVHocVan> HocVans { get; set; }
            = new List<CVHocVan>();

        public ICollection<CVKinhNghiemLamViec> KinhNghiems { get; set; }
            = new List<CVKinhNghiemLamViec>();

        public ICollection<CVDuAn> DuAns { get; set; }
            = new List<CVDuAn>();

        public ICollection<CVKyNang> KyNangs { get; set; }
            = new List<CVKyNang>();

        public ICollection<CVChungChi> ChungChis { get; set; }
            = new List<CVChungChi>();

        public ICollection<KetQuaPhanTichCv> KetQuaPhanTichCvs { get; set; }
            = new List<KetQuaPhanTichCv>();
    }
}
