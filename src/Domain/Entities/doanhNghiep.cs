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
    public class doanhNghiep : AuditableBaseEntity
    {
        public string tenDoanhNghiep { get; set; }
        public string moTa { get; set; }
        public string website { get; set; }
        public string diaChi { get; set; }
        public string logoUrl { get; set; }
        public string maSoThue {get; set;}
        public string linhVucHoatDong { get; set; }
        public string quyMoNhanSu { get; set; }
        public string nguoiDaiDien {get;set;}
        
        

        public ICollection<hoSoNhaTuyenDung> hoSoNhaTuyenDungs { get; set; }
        public ICollection<tinTuyenDung> tinTuyenDungs { get; set; }

    }
}
