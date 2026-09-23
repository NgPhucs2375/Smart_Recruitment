using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Account
{
    public class YeuCauDoiMatKhau
    {
        [Required]
        public string MatKhauHienTai { get; set; }

        [Required]
        [MinLength(6)]
        public string MatKhauMoi { get; set; }
    }
}
