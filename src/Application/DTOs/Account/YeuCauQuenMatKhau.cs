using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace Application.DTOs.Account
{
    /// <summary>
    /// Yêu cầu Client gửi lên thông tin email để lấy lại mật khẩu
    /// Email là bắt buộc, nếu không có sẽ trả về lỗi 400
    /// </summary>
    public class YeuCauQuenMatKhau
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
    }
}
