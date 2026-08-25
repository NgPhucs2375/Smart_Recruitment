using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using Application.DTOs.Account;
using Application.DTOs.Email;
using Application.Enums;
using Application.Exceptions;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Settings;
using Infrastructure.Identity.Contexts;
using Infrastructure.Identity.Helpers;
using Infrastructure.Identity.Models;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Domain.Enums;
using Domain.Entities;

namespace Infrastructure.Identity.Services
{
    public class AccountService : IAccountService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IEmailService _emailService;
        private readonly JWTSettings _jwtSettings;
        private readonly IDateTimeService _dateTimeService;
        private readonly IdentityContext _context;
        private readonly IApplicationDbContext _appContext;
        public AccountService(
            IdentityContext context,
            IApplicationDbContext appContext,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IOptions<JWTSettings> jwtSettings,
            IDateTimeService dateTimeService,
            SignInManager<ApplicationUser> signInManager,
            IEmailService emailService)
        {
            _context = context;
            _appContext = appContext;
            _userManager = userManager;
            _roleManager = roleManager;
            _jwtSettings = jwtSettings.Value;
            _dateTimeService = dateTimeService;
            _signInManager = signInManager;
            this._emailService = emailService;
        }

        public async Task<Response<AuthenticationResponse>> AuthenticateAsync(AuthenticationRequest request, string ipAddress)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                throw new ApiException($"No Accounts Registered with {request.Email}.");
            }
            var result = await _signInManager.PasswordSignInAsync(user.UserName, request.Password, false, lockoutOnFailure: false);
            if (!result.Succeeded)
            {
                throw new ApiException($"Invalid Credentials for '{request.Email}'.");
            }
            if (!user.EmailConfirmed)
            {
                throw new ApiException($"Account Not Confirmed for '{request.Email}'.");
            }
            JwtSecurityToken jwtSecurityToken = await GenerateJWToken(user);
            AuthenticationResponse response = new AuthenticationResponse();
            response.Id = user.Id;
            response.JWToken = new JwtSecurityTokenHandler().WriteToken(jwtSecurityToken);
            response.Email = user.Email;
            response.UserName = user.UserName;
            var rolesList = await _userManager.GetRolesAsync(user).ConfigureAwait(false);
            response.Roles = rolesList.ToList();
            response.IsVerified = user.EmailConfirmed;
            var refreshToken = GenerateRefreshToken(ipAddress);
            response.RefreshToken = refreshToken.Token;
            return new Response<AuthenticationResponse>(response, $"Authenticated {user.UserName}");
        }

        public async Task<Response<string>> RegisterAsync(YeuCauDangKy request, string origin)
        {
            // 1. Validate Role
            if (request.Role != "UngVien" && request.Role != "NhaTuyenDung")
                throw new ApiException("Vai trò không hợp lệ. Chỉ hỗ trợ: UngVien, NhaTuyenDung");

            // 2. Conditional validation for Employer
            if (request.Role == "NhaTuyenDung") {
                if (string.IsNullOrWhiteSpace(request.TenDoanhNghiep))
                    throw new ApiException("Tên doanh nghiệp là bắt buộc.");
                if (string.IsNullOrWhiteSpace(request.DiaChiDoanhNghiep))
                    throw new ApiException("Địa chỉ doanh nghiệp là bắt buộc.");
                if (string.IsNullOrWhiteSpace(request.ChucVu))
                    throw new ApiException("Chức vụ là bắt buộc.");
            }

            // 3. Generate username from email if not provided
            var userName = request.UserName ?? request.Email.Split('@')[0] + "_" + Guid.NewGuid().ToString("N")[..6];

            // 4. Check duplicates
            var userWithSameUserName = await _userManager.FindByNameAsync(userName);
            if (userWithSameUserName != null) throw new ApiException($"Username '{userName}' is already taken.");
            
            var userWithSameEmail = await _userManager.FindByEmailAsync(request.Email);
            if (userWithSameEmail != null) throw new ApiException($"Email {request.Email} is already registered.");

            // 5. Create ApplicationUser
            var user = new ApplicationUser
            {
                Email = request.Email,
                UserName = userName,
                // FirstName/LastName có thể map từ HoTen nếu cần backward compat
                FirstName = request.HoTen.Split(' ')[0],
                LastName = request.HoTen.Contains(' ') ? request.HoTen.Substring(request.HoTen.IndexOf(' ') + 1) : ""
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded) throw new ApiException($"{result.Errors}");

            // 6. Branch by Role
            if (request.Role == "UngVien") {
                await RegisterCandidateAsync(user, request);
            } else {
                await RegisterEmployerAsync(user, request);
            }

            // 7. Send verification email
            var verificationUri = await SendVerificationEmail(user, origin);
            await _emailService.SendAsync(new EmailRequest { 
                From = "noreply@yourdomain.com", 
                To = user.Email, 
                Body = $"Please confirm your account: {verificationUri}", 
                Subject = "Confirm Registration" 
            });

            return new Response<string>(user.Id, $"User Registered. Please confirm your account: {verificationUri}");
        }

        private async Task RegisterCandidateAsync(ApplicationUser user, YeuCauDangKy request) {
            await _userManager.AddToRoleAsync(user, Roles.UngVien.ToString());
            var nd = new nguoiDung {
                ApplicationUserId = user.Id,
                vaiTro = VaiTroNguoiDung.UNG_VIEN,
                Is_Active = true
            };
            await _appContext.nguoiDungs.AddAsync(nd);
            await _appContext.SaveChangesAsync();
            // KHÔNG tạo hoSoUngVien ở đây - để user tự tạo sau login
        }

        private async Task RegisterEmployerAsync(ApplicationUser user, YeuCauDangKy request) {
            await _userManager.AddToRoleAsync(user, Roles.NhaTuyenDung.ToString());
            
            // Tạo doanhNghiep
            var dn = new doanhNghiep {
                tenDoanhNghiep = request.TenDoanhNghiep,
                diaChi = request.DiaChiDoanhNghiep,
                moTa = request.MoTaDoanhNghiep,
                website = request.Website,
                logoUrl = request.LogoUrl,
            };
            await _appContext.doanhNghieps.AddAsync(dn);
            await _appContext.SaveChangesAsync();

            // Tạo nguoiDung + hoSoNhaTuyenDung
            var nd = new nguoiDung {
                ApplicationUserId = user.Id,
                vaiTro = VaiTroNguoiDung.NHA_TUYEN_DUNG,
                Is_Active = true
            };
            await _appContext.nguoiDungs.AddAsync(nd);
            await _appContext.SaveChangesAsync();

            var hs = new hoSoNhaTuyenDung {
                nguoiDungId = nd.Id,
                doanhNghiepId = dn.Id,
                hoTen = request.HoTen,
                SDT = request.SoDienThoai,
                chucVu = request.ChucVu
            };
            await _appContext.hoSoNhaTuyenDungs.AddAsync(hs);
            await _appContext.SaveChangesAsync();
        }

        class RolePermission
        {
            public string resource { get; set; }
            public string[] action { get; set; }
        }

        private async Task<string> GetPermissionOfRole(string roleName)
        {
            var role = await _roleManager.FindByNameAsync(roleName);
            var roleClaimsForRole = _context.RoleClaims.Where(rc => rc.RoleId == role.Id).ToList();
            List<RolePermission> rolePermissions = new List<RolePermission>();
            foreach (var item in roleClaimsForRole)
            {
                rolePermissions.Add(new RolePermission
                {
                    resource = item.ClaimType,
                    action = item.ClaimValue.Split("#")
                });
            }

            return JsonConvert.SerializeObject(
            new
            {
                role = roleName,
                permissions = rolePermissions

            });
        }

        private async Task<JwtSecurityToken> GenerateJWToken(ApplicationUser user)
        {
            var userClaims = await _userManager.GetClaimsAsync(user);
            var roles = await _userManager.GetRolesAsync(user);

            var roleClaims = new List<Claim>();

            for (int i = 0; i < roles.Count; i++)
            {
                roleClaims.Add(new Claim("roles", await GetPermissionOfRole(roles[i].ToString())));
            }

            string ipAddress = IpHelper.GetIpAddress();

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("uid", user.Id),
                new Claim("ip", ipAddress),
                new Claim("permission",roles.FirstOrDefault())
            }
            .Union(userClaims)
            .Union(roleClaims);

            var symmetricSecurityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
            var signingCredentials = new SigningCredentials(symmetricSecurityKey, SecurityAlgorithms.HmacSha256);

            var jwtSecurityToken = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_jwtSettings.DurationInMinutes),
                signingCredentials: signingCredentials);
            return jwtSecurityToken;
        }

        private string RandomTokenString()
        {
            using var rngCryptoServiceProvider = new RNGCryptoServiceProvider();
            var randomBytes = new byte[40];
            rngCryptoServiceProvider.GetBytes(randomBytes);
            // convert random bytes to hex string
            return BitConverter.ToString(randomBytes).Replace("-", "");
        }

        private async Task<string> SendVerificationEmail(ApplicationUser user, string origin)
        {
            var code = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(code));
            var route = "api/account/confirm-email/";
            var _enpointUri = new Uri(string.Concat($"{origin}/", route));
            var verificationUri = QueryHelpers.AddQueryString(_enpointUri.ToString(), "userId", user.Id);
            verificationUri = QueryHelpers.AddQueryString(verificationUri, "code", code);
            //Email Service Call Here
            return verificationUri;
        }

        public async Task<Response<string>> ConfirmEmailAsync(string userId, string code)
        {
            var user = await _userManager.FindByIdAsync(userId);
            code = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(code));
            var result = await _userManager.ConfirmEmailAsync(user, code);
            if (result.Succeeded)
            {
                return new Response<string>(user.Id, message: $"Account Confirmed for {user.Email}. You can now use the /api/Account/authenticate endpoint.");
            }
            else
            {
                throw new ApiException($"An error occured while confirming {user.Email}.");
            }
        }

        private RefreshToken GenerateRefreshToken(string ipAddress)
        {
            return new RefreshToken
            {
                Token = RandomTokenString(),
                Expires = DateTime.UtcNow.AddDays(7),
                Created = DateTime.UtcNow,
                CreatedByIp = ipAddress
            };
        }

        public async Task ForgotPassword(YeuCauQuenMatKhau model, string origin)
        {
            var account = await _userManager.FindByEmailAsync(model.Email);

            // always return ok response to prevent email enumeration
            if (account == null) return;

            var code = await _userManager.GeneratePasswordResetTokenAsync(account);
            var route = "api/account/reset-password/";
            var _enpointUri = new Uri(string.Concat($"{origin}/", route));
            var emailRequest = new EmailRequest()
            {
                Body = $"You reset token is - {code}",
                To = model.Email,
                Subject = "Reset Password",
            };
            await _emailService.SendAsync(emailRequest);
        }

        public async Task<Response<string>> ResetPassword(YeuCauGuiLaiXacMinh model)
        {
            var account = await _userManager.FindByEmailAsync(model.Email);
            if (account == null) throw new ApiException($"No Accounts Registered with {model.Email}.");
            var result = await _userManager.ResetPasswordAsync(account, model.Token, model.Password);
            if (result.Succeeded)
            {
                return new Response<string>(model.Email, message: $"Password Resetted.");
            }
            else
            {
                throw new ApiException($"Error occured while reseting the password.");
            }
        }

        public async Task ResendVerificationEmailAsync(string email, string origin)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null) return;

            var verificationUri = await SendVerificationEmail(user, origin);
            await _emailService.SendAsync(new EmailRequest { 
                From = "noreply@yourdomain.com", 
                To = user.Email, 
                Body = $"Please confirm your account: {verificationUri}", 
                Subject = "Confirm Registration" 
            });
        }
    }

}
