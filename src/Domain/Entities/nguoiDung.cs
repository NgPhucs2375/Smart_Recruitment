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
    public class nguoiDung : AuditableBaseEntity
    {
        public string ApplicationUserId { get; set; }
        public VaiTroNguoiDung vaiTro { get; set; }
        public bool Is_Active { get; set; } = true;

        public hoSoUngVien hoSoUngViens { get; set; }
        public hoSoNhaTuyenDung hoSoNhaTuyenDungs { get; set; }

    }
}
