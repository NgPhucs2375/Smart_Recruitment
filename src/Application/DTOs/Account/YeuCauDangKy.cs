using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Application.DTOs.Account
{
    public class YeuCauDangKy
    {
        [Required]
        [JsonPropertyName("role")]
        public string Role { get; set; } // UngVien | NguoiDaiDien

        [Required]
        [EmailAddress]
        [JsonPropertyName("email")]
        public string Email { get; set; }
  
        [JsonPropertyName("userName")]
        public string UserName { get; set; }

        [Required]
        [MinLength(6)]
        [JsonPropertyName("password")]
        public string Password { get; set; }

        [Required]
        [JsonPropertyName("hoTen")]
        public string HoTen { get; set; }

        [Required]
        [Phone]
        [JsonPropertyName("soDienThoai")]
        public string SoDienThoai { get; set; }

        [Required]
        [Compare("Password")]
        [JsonPropertyName("confirmPassword")]
        public string ConfirmPassword { get; set; }

        // Dành riêng cho NhaTuyenDung
        [JsonPropertyName("chucVu")]
        public string ChucVu { get; set; }
        [JsonPropertyName("tenDoanhNghiep")]
        public string TenDoanhNghiep { get; set; }
        [JsonPropertyName("diaChiDoanhNghiep")]
        public string DiaChiDoanhNghiep { get; set; }
        public string MoTaDoanhNghiep { get; set; }
        public string Website { get; set; }
        public string LogoUrl { get; set; }
        [JsonPropertyName("maSoThue")]
        public string MaSoThue { get; set; }
        [JsonPropertyName("linhVucHoatDong")]
        public string LinhVucHoatDong { get; set; }
        [JsonPropertyName("quyMoNhanSu")]
        public string QuyMoNhanSu { get; set; }

        // Dành riêng cho đăng ký bằng lời mời (NhanSu)
        public string InviteToken { get; set; }
    }
}