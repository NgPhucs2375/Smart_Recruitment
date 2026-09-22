using Domain.Common;
using Domain.Enums;
using System;
using System.Collections.Generic;

namespace Domain.Entities
{
    public class LoiMoiNhanSu : AuditableBaseEntity
    {
        public int DoanhNghiepId { get; set; }
        public int NguoiDaiDienId { get; set; }
        public string Email { get; set; }
        public string Token { get; set; }
        public string HoTen { get; set; }
        public string ChucVu { get; set; }
        public TrangThaiLoiMoi LoiMoi { get; set; }
        public DateTime NgayHetHan { get; set; }

        public DoanhNghiep DoanhNghiep { get; set; }
        public NguoiDung NguoiDaiDien { get; set; }
    }
}
