using Domain.Common;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    /// <summary>
    /// Thông tin công ty/doanh nghiệp tuyển dụng.
    /// </summary>
    public class DoanhNghiep : AuditableBaseEntity
    {
        public string TenDoanhNghiep { get; set; }
        public string MoTa { get; set; }
        public string Website { get; set; }
        public string DiaChi { get; set; }
        public string LogoUrl { get; set; }
        public string MaSoThue {get; set;}
        public string LinhVucHoatDong { get; set; }
        public string QuyMoNhanSu { get; set; }

        public ICollection<HoSoNhaTuyenDung> HoSoNhaTuyenDungs { get; set; }
        public ICollection<TinTuyenDung> TinTuyenDungs { get; set; }
        public ICollection<LoiMoiNhanSu> LoiMoiNhanSus { get; set; }

    }
}
