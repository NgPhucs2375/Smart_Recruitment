using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Account
{
    public class YeuCauMagicLink {
        [Required][EmailAddress] public string Email { get; set; }
        public string? Purpose { get; set; } // "Login" | "Register"
        public string? Role { get; set; } // UNG_VIEN/NGUOI_DAI_DIEN (khi Register)
        public string? HoTen { get; set; }
        [Phone] public string? SoDienThoai { get; set; }
        // khi NGUOI_DAI_DIEN:
        public string? TenDoanhNghiep { get; set; }
        public string? DiaChiDoanhNghiep { get; set; }
        public string? ChucVu { get; set; }
    }
}