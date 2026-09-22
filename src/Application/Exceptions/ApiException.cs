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
        // thuộc tính lưu trữ mã lỗi HTTP
        public int StatusCode { get; set; }
        public ApiException() : base() { 
            StatusCode = 400;
        } // constructor mặc định, gọi constructor của lớp Exception

        public ApiException(string message,int statusCode) : base(message) { 
            StatusCode = statusCode;
        } // constructor nhận vào một chuỗi message, gọi constructor của lớp Exception với message đó

        public ApiException(string message, params object[] args)
            : base(String.Format(CultureInfo.CurrentCulture, message, args))
        {
            StatusCode = 400;
        } // constructor nhận vào một chuỗi message và một mảng args, dùng String.Format để định dạng message theo args, gọi constructor của lớp Exception với message đã định dạng
    }
}
