using FluentValidation.Results;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Application.Exceptions
{
    /// <summary>
    /// Gom các thông báo lỗi ErrorMessage thu được từ FluentValidation thành list 
    /// Để ném ra ngoại lệ nhất quán khi dữ liệu yêu cầu không hợp lệ
    /// </summary>
    public class ValidationException : Exception
    {
        // constructor mặc định, gọi constructor của lớp Exception với thông báo lỗi mặc định
        public ValidationException() : base("Một hoặc nhiều lỗi xác thực đã xảy ra.")
        {
            Errors = new List<string>();
        }
        public List<string> Errors { get; } // danh sách các thông báo lỗi xác thực, được khởi tạo trong constructor mặc định

        // constructor nhận vào một mảng các đối tượng ValidationFailure, dùng để khởi tạo danh sách Errors
        public ValidationException(IEnumerable<ValidationFailure> failures)
            : this()
        {
            foreach (var failure in failures)
            {
                Errors.Add(failure.ErrorMessage);
            }
        }

    }
}

