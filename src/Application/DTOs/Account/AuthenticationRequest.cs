using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.Account
{
    /// <summary>
    /// Yêu cầu Client gửi lên thông tin tài khoản để xác thực
    /// Email và Password là bắt buộc, nếu không có sẽ trả về lỗi 400
    /// </summary>
    public class AuthenticationRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}
