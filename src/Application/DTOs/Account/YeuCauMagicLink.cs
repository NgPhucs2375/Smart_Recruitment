using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Account
{
    public class YeuCauMagicLink {
        [Required][EmailAddress][MaxLength(100)] public string Email { get; set; }
        public string? Purpose { get; set; } // "Login" | "Register"
        public string? Role { get; set; } // UNG_VIEN/NGUOI_DAI_DIEN (khi Register)
        public string? HoTen { get; set; }
        [RegularExpression(@"^0(3|5|7|8|9)\d{8}$", ErrorMessage = "Số điện thoại di động VN không hợp lệ.")]
        public string? SoDienThoai { get; set; }
        // khi NGUOI_DAI_DIEN:
        public string? TenDoanhNghiep { get; set; }
        public string? DiaChiDoanhNghiep { get; set; }
        public string? ChucVu { get; set; }
    }
}
