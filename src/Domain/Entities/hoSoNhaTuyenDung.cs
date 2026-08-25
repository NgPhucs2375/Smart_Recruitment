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
    public class hoSoNhaTuyenDung : AuditableBaseEntity
    {
        public int nguoiDungId { get; set; }
        public int doanhNghiepId { get; set; }
        public string hoTen { get; set; }
        public string SDT { get; set; }
        public string chucVu { get; set; }

        // ===   === //
        public nguoiDung nguoiDungs { get; set; }
        public doanhNghiep doanhNghieps { get; set; }
    }
}
