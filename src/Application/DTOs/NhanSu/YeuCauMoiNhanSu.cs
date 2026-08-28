using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.NhanSu
{
    public class YeuCauMoiNhanSu
    {
        public int DoanhNghiepId { get; set; }
        [Required]
        public string Email { get; set; }
        public string HoTen { get; set; }
        public string ChucVu { get; set; }
    }
}