using Domain.Common;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    /// <summary>
    /// Thông tin cá nhân của người đại diện tuyển dụng
    /// </summary>
    public class HoSoNhaTuyenDung : AuditableBaseEntity
    {
        public int NguoiDungId { get; set; }
        public int DoanhNghiepId { get; set; }
        public string HoTen { get; set; }
        public string SDT { get; set; }
        public string ChucVu { get; set; }

        // ===   === //
        public NguoiDung NguoiDung { get; set; }
        public DoanhNghiep DoanhNghiep { get; set; }
    }
}
