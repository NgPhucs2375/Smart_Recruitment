using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.Account
{
    /// <summary>
    /// 
    /// 
    /// </summary>
    public class HoSoUngVien
    {
        public string HoTen { get; set; }
        public string SDT { get; set; }
        public string Email { get; set; }
        public string ViTriUngTuyen { get; set; }
        public string GioiTinh { get; set; }
        public DateTime NgaySinh { get; set; }
        public string DiaChi { get; set; }
        public string GioiThieu {get; set;}
    }
}
