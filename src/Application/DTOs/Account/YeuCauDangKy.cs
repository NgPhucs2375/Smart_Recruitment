using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Account
{
    public class YeuCauDangKy
    {
        [Required]
        public string Role { get; set; } // UngVien | NguoiDaiDien

        [Required]
        [EmailAddress]
        public string Email { get; set; }
  
        public string UserName { get; set; }

        [Required]
        [MinLength(6)]
        public string Password { get; set; }

        [Required]
        public string HoTen { get; set; }

        [Required]
        [Phone]
        public string SoDienThoai { get; set; }

        [Required]
        [Compare("Password")]
        public string ConfirmPassword { get; set; }

        // Dành riêng cho NhaTuyenDung
        public string ChucVu { get; set; }
        public string TenDoanhNghiep { get; set; }
        public string DiaChiDoanhNghiep { get; set; }
        public string MoTaDoanhNghiep { get; set; }
        public string Website { get; set; }
        public string LogoUrl { get; set; }
        public string MaSoThue { get; set; }
        public string LinhVucHoatDong { get; set; }
        public string QuyMoNhanSu { get; set; }

        // Dành riêng cho đăng ký bằng lời mời (NhanSu)
        public string InviteToken { get; set; }
    }
}