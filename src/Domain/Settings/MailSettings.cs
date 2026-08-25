using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Settings
{
    /// <summary>
    /// Chứa các cấu hình kết nối tới SMTP Server
    /// phục vụ gủi email tự động (xác nhận tài khoản,quên pass, thông báo lịch phỏng vấn)
    /// </summary>
    public class MailSettings
    {
        public string EmailFrom { get; set; } // Địa chỉ email gửi đi
        public string SmtpHost { get; set; } // Địa chỉ SMTP Server
        public int SmtpPort { get; set; } // Port SMTP
        public string SmtpUser { get; set; } // Tài khoản SMTP
        public string SmtpPass { get; set; } // Mật khẩu SMTP
        public string DisplayName { get; set; } // Tên hiển thị khi gửi email
    }
}
