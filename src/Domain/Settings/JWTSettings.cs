using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Settings
{
    /// <summary>
    /// Chứa các cấu hình phục vụ cho việc tạo và xác thực JWT 
    /// </summary>
    public class JWTSettings
    {
        public string Key { get; set; } // Secret Key
        public string Issuer { get; set; } // Đơn vị phát hành token
        public string Audience { get; set; } // Đối tượng sử dụng token
        public double DurationInMinutes { get; set; } // Thời gian tồn tại của token (phút)
    }
}
