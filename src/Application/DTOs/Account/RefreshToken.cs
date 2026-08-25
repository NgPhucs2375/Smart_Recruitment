using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.Account
{
    /// <summary>
    /// Lưu và Theo dõi trạng tháo của phiên đăng nhập
    /// hỗ trợ cấp lại token mới an toàn 
    /// </summary>
    public class RefreshToken
    {
        public int Id { get; set; } // Id của RefreshToken trong cơ sở dữ liệu
        public string Token { get; set; } // Token được tạo ra để cấp lại JWT khi JWT hết hạn
        public DateTime Expires { get; set; } // Thời gian hết hạn của RefreshToken
        public bool IsExpired => DateTime.UtcNow >= Expires; // Kiểm tra xem RefreshToken đã hết hạn hay chưa
        public DateTime Created { get; set; } // Thời gian tạo ra RefreshToken
        public string CreatedByIp { get; set; } // Địa chỉ IP của Client khi tạo ra RefreshToken
        public DateTime? Revoked { get; set; } // Thời gian bị thu hồi của RefreshToken, nếu null thì chưa bị thu hồi
        public string RevokedByIp { get; set; } // Địa chỉ IP của Client khi thu hồi RefreshToken
        public string ReplacedByToken { get; set; } // Token mới được tạo ra để thay thế cho RefreshToken này, nếu null thì chưa bị thay thế
        public bool IsActive => Revoked == null && !IsExpired; // Kiểm tra xem RefreshToken còn hoạt động hay không, nếu chưa bị thu hồi và chưa hết hạn thì còn hoạt động
    }
}
