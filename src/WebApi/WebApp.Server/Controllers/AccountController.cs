using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Application.DTOs.Account;
using Application.Exceptions;
using Application.Interfaces;
using Infrastructure.Identity.Features.Users.Queries.GetMeByToken;
using Microsoft.AspNetCore.Hosting;
using Casbin;
using Domain.Enums;
using Application.Wrappers;

namespace WebApp.Server.Controllers
{
    [Route("api/account")]
    [ApiController]
    public class AccountController : BaseApiController
    {
        private readonly IAccountService _accountService;

        public AccountController(IAccountService accountService, IWebHostEnvironment webEnvironment, Enforcer enforcer) : base(webEnvironment, enforcer)
        {
            _accountService = accountService;
        }

        // Đăng nhập (Trả về JWT + Refresh Token)
        [HttpPost("authenticate")]
        public async Task<IActionResult> AuthenticateAsync([FromBody] AuthenticationRequest request)
        {
            return Ok(await _accountService.AuthenticateAsync(request, GenerateIPAddress()));
        }

        // Đăng ký tài khoản
        [HttpPost("register")]
        public async Task<IActionResult> RegisterAsync([FromBody] YeuCauDangKy request)
        {
            var origin = FrontendOrigin();
            return Ok(await _accountService.RegisterAsync(request, origin));
        }

        // Xác thực email qua link kích hoạt
        [HttpGet("confirm-email")]
        public async Task<IActionResult> ConfirmEmailAsync([FromQuery] string userId, [FromQuery] string code)
        {
            return Ok(await _accountService.ConfirmEmailAsync(userId, code));
        }

        // Yêu cầu gửi email quên mật khẩu
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] YeuCauQuenMatKhau model)
        {
            var origin = FrontendOrigin();

            await _accountService.ForgotPassword(model, origin);
            return Ok(new Response<string>(string.Empty, "Nếu tài khoản tồn tại, yêu cầu gửi liên kết đặt lại mật khẩu đã được tiếp nhận."));
        }

        // Đặt lại mật khẩu
        [HttpPost("resend-verification-email")]
        public async Task<IActionResult> ResendVerificationEmail([FromBody] YeuCauQuenMatKhau model)
        {
            await _accountService.ResendVerificationEmailAsync(model.Email, FrontendOrigin());
            return Ok(new Response<string>(string.Empty, "Nếu email chưa xác minh, yêu cầu gửi lại liên kết đã được tiếp nhận."));
        }

        [HttpPost("revoke-token")]
        public async Task<IActionResult> RevokeToken([FromBody] RefreshTokenRequest model) =>
            Ok(await _accountService.RevokeRefreshTokenAsync(model.Token, GenerateIPAddress()));

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] YeuCauGuiLaiXacMinh model)
        {
            return Ok(await _accountService.ResetPassword(model));
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] YeuCauDoiMatKhau model)
        {
            return Ok(await _accountService.ChangePasswordAsync(model));
        }

        // Lấy thông tin tài khoản hiện tại từ JWT
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUserAsync()
        {
            if (HttpContext.User.Identity is ClaimsIdentity identity)
            {
                return Ok(await Mediator.Send(new GetMeByTokenQuery { Identity = identity }));
            }
            else
            {
                throw new ApiException("Không tìm thấy người dùng!", 404);
            }
        }
        
        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshTokenAsync([FromBody] RefreshTokenRequest request)
        {
            return Ok(await _accountService.RefreshTokenAsync(request.Token, GenerateIPAddress()));
        }

        [HttpPost("external-login")]
        public async Task<IActionResult> ExternalLoginAsync([FromBody] ExternalAuthRequest request)
        {
            return Ok(await _accountService.ExternalLoginAsync(request,GenerateIPAddress()));
        }

        [HttpPost("request-magic-link")]
        public async Task<IActionResult> RequestMagicLinkAsync([FromBody] YeuCauMagicLink request)
        {
            var origin = FrontendOrigin();
            return Ok(await _accountService.RequestMagicLinkAsync(request, origin));
        }

        [HttpPost("magic-login")]
        public async Task<IActionResult> MagicLoginAsync([FromBody] DoiMagicLink request)
        {
            return Ok(await _accountService.MagicLoginAsync(request, GenerateIPAddress()));
        }
        private string GenerateIPAddress()
        {
           if (Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
            {
                return forwardedFor.ToString();
            }

            return HttpContext.Connection.RemoteIpAddress?.MapToIPv4().ToString() ?? "127.0.0.1";
        }

        private string FrontendOrigin()
        {
            var configuration = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            var allowed = configuration.GetSection("Frontend:AllowedOrigins").Get<string[]>()
                ?? (configuration["Frontend:AllowedOrigins"] ?? "").Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries);
            var environment = HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>();
            if (environment.IsDevelopment()) allowed = allowed.Concat(new[] { "http://localhost:3000", "http://localhost:3001" }).ToArray();
            var origin = Request.Headers["origin"].ToString();
            if (string.IsNullOrWhiteSpace(origin)) return allowed.FirstOrDefault()?.TrimEnd('/')
                ?? throw new ApiException("Chưa cấu hình địa chỉ frontend.");
            if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https"))
                throw new ApiException("Địa chỉ frontend không hợp lệ.");
            var normalized = uri.GetLeftPart(UriPartial.Authority);
            if (!allowed.Any(x => string.Equals(x.Trim().TrimEnd('/'), normalized, StringComparison.OrdinalIgnoreCase)))
                throw new ApiException("Địa chỉ frontend không được phép.");
            return normalized;
        }
    }
}
