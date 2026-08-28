using Domain.Common;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    /// <summary>
    /// Quản lý tài khoản và phân quyền hệ thống
    /// </summary>
    public class NguoiDung : AuditableBaseEntity
    {
        public string ApplicationUserId { get; set; }
        public VaiTroNguoiDung VaiTro { get; set; }
        public bool IsActive { get; set; } = true;

        public HoSoUngVien HoSoUngVien { get; set; }
        public HoSoNhaTuyenDung HoSoNhaTuyenDung { get; set; }
        public ICollection<LoiMoiNhanSu> LoiMoiNhanSus { get; set; }
        public ICollection<TinTuyenDung> TinTuyenDungs { get; set; }

    }
}
