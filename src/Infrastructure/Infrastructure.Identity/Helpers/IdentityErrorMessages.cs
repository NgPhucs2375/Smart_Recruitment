using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace Infrastructure.Identity.Helpers
{
    /// <summary>
    /// Maps ASP.NET Identity error codes to user-facing Vietnamese messages.
    /// Translates by <see cref="IdentityError.Code"/> only: Description comes from
    /// IdentityErrorDescriber and is English in the default culture.
    /// </summary>
    public static class IdentityErrorMessages
    {
        public const string GenericResetToken = "Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.";

        public static string Map(IEnumerable<IdentityError> errors, string fallback, IOptions<IdentityOptions> options)
        {
            var password = options?.Value?.Password;
            foreach (var error in errors ?? Enumerable.Empty<IdentityError>())
            {
                if (TryTranslate(error.Code, password, out var message))
                    return message;
            }

            // Fail closed: an unmapped code must never surface a framework Description.
            return fallback;
        }

        private static bool TryTranslate(string code, PasswordOptions password, out string message)
        {
            message = null;
            switch (code)
            {
                case nameof(IdentityErrorDescriber.PasswordTooShort):
                    message = $"Mật khẩu phải có tối thiểu {password?.RequiredLength ?? 6} ký tự.";
                    return true;
                case nameof(IdentityErrorDescriber.PasswordRequiresUpper):
                    message = "Mật khẩu phải có ít nhất một chữ hoa (A-Z).";
                    return true;
                case nameof(IdentityErrorDescriber.PasswordRequiresLower):
                    message = "Mật khẩu phải có ít nhất một chữ thường (a-z).";
                    return true;
                case nameof(IdentityErrorDescriber.PasswordRequiresDigit):
                    message = "Mật khẩu phải có ít nhất một chữ số (0-9).";
                    return true;
                case nameof(IdentityErrorDescriber.PasswordRequiresNonAlphanumeric):
                    message = "Mật khẩu phải có ít nhất một ký tự đặc biệt (ví dụ !, @, #).";
                    return true;
                case nameof(IdentityErrorDescriber.PasswordRequiresUniqueChars):
                    message = $"Mật khẩu phải có ít nhất {password?.RequiredUniqueChars ?? 1} ký tự khác nhau.";
                    return true;
                case nameof(IdentityErrorDescriber.PasswordMismatch):
                    message = "Mật khẩu hiện tại không đúng.";
                    return true;
                case nameof(IdentityErrorDescriber.DuplicateUserName):
                    message = "Tên đăng nhập đã được sử dụng.";
                    return true;
                case nameof(IdentityErrorDescriber.DuplicateEmail):
                    message = "Email đã được đăng ký trong hệ thống.";
                    return true;
                case nameof(IdentityErrorDescriber.InvalidEmail):
                    message = "Email không hợp lệ.";
                    return true;
                case nameof(IdentityErrorDescriber.InvalidUserName):
                    message = "Tên đăng nhập không hợp lệ.";
                    return true;
                // Token failures must stay indistinguishable from "account not found"
                // so the reset endpoint cannot be used to enumerate emails.
                case nameof(IdentityErrorDescriber.InvalidToken):
                case "UserNotFound":
                case nameof(IdentityErrorDescriber.DefaultError):
                    message = GenericResetToken;
                    return true;
                default:
                    return false;
            }
        }
    }
}
