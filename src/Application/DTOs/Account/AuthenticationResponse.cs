using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Application.DTOs.Account
{
    /// <summary>
    /// Phản hồi từ Server gửi về Client sau khi xác thực thành công
    /// Gồm thông tin người dùng và JWT
    /// </summary>
    public class AuthenticationResponse
    {
        public string Id { get; set; } // Id user
        public string UserName { get; set; } // Tên người dùng
        public string Email { get; set; } // Email người dùng
        public List<string> Roles { get; set; } // Danh sách quyền của người dùng
        public bool IsVerified { get; set; } // Trạng thái xác thực email của người dùng
        public string JWToken { get; set; } // JWT được tạo ra sau khi xác thực thành công, dùng để xác thực các request tiếp theo
        public string RefreshToken { get; set; } // RefreshToken được tạo ra sau khi xác thực thành công, dùng để lấy lại JWT khi JWT hết hạn

        // [JsonIgnore] : dùng để loại bỏ thuộc tính này khi serialize đối tượng thành JSON, tránh gửi RefreshToken về Client
    }
}
