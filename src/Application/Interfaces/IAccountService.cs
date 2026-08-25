using Microsoft.Extensions.Primitives;
using Application.DTOs.Account;
using Application.Wrappers;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface IAccountService
    {
        Task<Response<AuthenticationResponse>> AuthenticateAsync(AuthenticationRequest request, string ipAddress);
        Task<Response<string>> RegisterAsync(YeuCauDangKy request, string origin);
        Task<Response<string>> ConfirmEmailAsync(string userId, string code);
        Task ForgotPassword(YeuCauQuenMatKhau model, string origin);
        Task<Response<string>> ResetPassword(YeuCauGuiLaiXacMinh model);
        // Task ResendVerificationEmailAsync(string email, string origin);
    }
}
