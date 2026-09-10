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

        // Chủ sở hữu duy nhất (1 DN - 1 NGUOI_DAI_DIEN, 1-1 nghiêm ngặt).
        // Nullable để migration không fail với dữ liệu cũ; code mới luôn set.
        public int? NguoiDaiDienId { get; set; }
        public NguoiDung NguoiDaiDien { get; set; }

        public ICollection<HoSoNhaTuyenDung> HoSoNhaTuyenDungs { get; set; }
        public ICollection<TinTuyenDung> TinTuyenDungs { get; set; }
        public ICollection<LoiMoiNhanSu> LoiMoiNhanSus { get; set; }

    }
}
