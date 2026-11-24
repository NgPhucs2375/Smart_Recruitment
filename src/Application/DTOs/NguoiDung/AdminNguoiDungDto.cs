using Domain.Enums;

namespace Application.DTOs.NguoiDung
{
    /// <summary>
    /// Dòng hiển thị cho màn hình quản trị người dùng:
    /// gộp hồ sơ NguoiDung với tài khoản đăng nhập (email/username/khóa).
    /// </summary>
    public class AdminNguoiDungDto
    {
        public int Id { get; set; }

        public string Email { get; set; }

        public string UserName { get; set; }
        public string HoTen { get; set; }
        public string PhoneNumber { get; set; }

        public string ApplicationUserId { get; set; }

        public VaiTroNguoiDung VaiTro { get; set; }

        public bool IsActive { get; set; }

        public bool IsLocked { get; set; }

        public bool EmailConfirmed { get; set; }

        public DateTime Created { get; set; }

        public bool HasRelatedData { get; set; }

        public int? DoanhNghiepId { get; set; }

        public string TenDoanhNghiep { get; set; }
    }
}
