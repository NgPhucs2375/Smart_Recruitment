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

        public string ApplicationUserId { get; set; }

        public VaiTroNguoiDung VaiTro { get; set; }

        public bool IsActive { get; set; }

        public bool IsLocked { get; set; }
    }
}
