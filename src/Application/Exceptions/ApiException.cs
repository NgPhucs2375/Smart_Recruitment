using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

namespace Application.Exceptions
{
    /// <summary>
    /// Phân biệt và ném lỗi nghiệp vụ hoặc lỗi hệ thống API 
    /// Tùy chỉnh kèm hỗ trợ định dạng tin nhắn linh hoạt
    /// </summary>
    public class ApiException : Exception // kế thừa lớp Exception
    {
        public ApiException() : base() { } // constructor mặc định, gọi constructor của lớp Exception

        public ApiException(string message) : base(message) { } // constructor nhận vào một chuỗi message, gọi constructor của lớp Exception với message đó

        public ApiException(string message, params object[] args)
            : base(String.Format(CultureInfo.CurrentCulture, message, args))
        {
        } // constructor nhận vào một chuỗi message và một mảng args, dùng String.Format để định dạng message theo args, gọi constructor của lớp Exception với message đã định dạng
    }
}
