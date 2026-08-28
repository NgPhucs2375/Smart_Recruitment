using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using Application.DTOs.Account;
using Application.DTOs.Email;
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
using Microsoft.EntityFrameworkCore;

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
        private readonly IAuthenticatedUserService _authenticatedUserService;
        public AccountService(
            IdentityContext context,
            IApplicationDbContext appContext,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IOptions<JWTSettings> jwtSettings,
            IDateTimeService dateTimeService,
            SignInManager<ApplicationUser> signInManager,
            IEmailService emailService,
            IAuthenticatedUserService authenticatedUserService)
        {
            _context = context;
            _appContext = appContext;
            _userManager = userManager;
            _roleManager = roleManager;
            _jwtSettings = jwtSettings.Value;
            _dateTimeService = dateTimeService;
            _signInManager = signInManager;
            this._emailService = emailService;
            _authenticatedUserService = authenticatedUserService;
        }

        internal sealed record RolePermission
        (
            string resource ,
            string[] action 
        );

        /// <summary>
        /// Core của Module Xác thực
        /// Chức năng: tiếp nhận thông tin đăng nhập | kiểm tra tính hợp lệ của người dùng qua ASP.NET Core Identity | 
        ///          : phát hành danh tính số bao gồm Access Token (JWT) cùng Refresh Token để Client sử dụng cho các phiên làm việc tiếp theo
        /// </summary>
        public async Task<Response<AuthenticationResponse>> AuthenticateAsync(AuthenticationRequest request, string ipAddress)
        {
            // Tìm kiếm User theo Email
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                throw new ApiException($"Chưa có tài khoản nào đăng ký với {request.Email}.");
            }

            // Kiểm tra Mật khẩu
            var result = await _signInManager.PasswordSignInAsync(user.UserName, request.Password, false, lockoutOnFailure: false);
            if (!result.Succeeded)
            {
                throw new ApiException($"Thông tin đăng nhập không hợp lệ cho '{request.Email}'.");
            }

            // Kiểm tra Xác thực Email
            if (!user.EmailConfirmed)
            {
                throw new ApiException($"Tài khoản chưa được xác nhận cho '{request.Email}'.");
            }
           
            // 1. Khởi tạo Access Token và Refresh Token
            JwtSecurityToken jwtSecurityToken = await GenerateJWToken(user).ConfigureAwait(false);
            var refreshToken = GenerateRefreshToken(ipAddress);

            // 2. Quản lý danh sách Token và lưu trữ vào CSDL
            user.RefreshTokens ??= new List<RefreshToken>();
            user.RefreshTokens.RemoveAll(t => !t.IsActive && t.Created.AddDays(30) <= DateTime.UtcNow);
            user.RefreshTokens.Add(refreshToken);

            await _userManager.UpdateAsync(user).ConfigureAwait(false);

            // 3. Lấy danh sách Roles
            var rolesList = await _userManager.GetRolesAsync(user).ConfigureAwait(false);

            // 4. Khởi tạo Response theo Object Initializer
            var response = new AuthenticationResponse
            {
                Id = user.Id,
                JWToken = new JwtSecurityTokenHandler().WriteToken(jwtSecurityToken),
                Email = user.Email,
                UserName = user.UserName,
                Roles = rolesList.ToList(),
                IsVerified = user.EmailConfirmed,
                RefreshToken = refreshToken.Token
            };

            return new Response<AuthenticationResponse>(response, $"Đã xác thực {user.UserName}");
        }

        /// <summary>
        /// Làm điều phối quy trình khởi tạo danh tính và nghiệp vụ (Onboarding Orchestrator)
        /// Chức năng: chịu trách nhiệm chuyển đổi một yêu cầu đăng ký thô thành một người dùng hợp lệ trên cả hệ thống bảo mật và cơ sở dữ liệu nghiệp vụ
        /// </summary>
       public async Task<Response<string>> RegisterAsync(YeuCauDangKy request, string origin)
        {
            // 1. Kiểm tra tính hợp lệ của vai trò
            string ungVienRole = VaiTroNguoiDung.UNG_VIEN.ToString();
            string daidienRole = VaiTroNguoiDung.NGUOI_DAI_DIEN.ToString();

            if (string.IsNullOrWhiteSpace(request.InviteToken))
            {
                if (request.Role != ungVienRole && request.Role != daidienRole)
                {
                    throw new ApiException("Vai trò không hợp lệ. Chỉ hỗ trợ: UngVien, NguoiDaiDien");
                }
                if (request.Role == VaiTroNguoiDung.NHAN_SU.ToString())
                {
                    throw new ApiException("Vai trò Nhân sự chỉ được tạo thông qua lời mời từ người đại diện doanh nghiệp.");
                }

                // 2. Kiểm tra dữ liệu bổ sung cho Nhà tuyển dụng
                if (request.Role == daidienRole)
                {
                    if (string.IsNullOrWhiteSpace(request.TenDoanhNghiep))
                        throw new ApiException("Tên doanh nghiệp là bắt buộc.");
                    if (string.IsNullOrWhiteSpace(request.DiaChiDoanhNghiep))
                        throw new ApiException("Địa chỉ doanh nghiệp là bắt buộc.");
                    if (string.IsNullOrWhiteSpace(request.ChucVu))
                        throw new ApiException("Chức vụ là bắt buộc.");
                }
            }

            // 3. Khởi tạo UserName nếu chưa có
            var userName = !string.IsNullOrWhiteSpace(request.UserName)
                ? request.UserName
                : $"{request.Email.Split('@')[0]}_{Guid.NewGuid().ToString("N")[..6]}";

            // 4. Kiểm tra trùng lặp thông tin
            var userWithSameUserName = await _userManager.FindByNameAsync(userName).ConfigureAwait(false);
            if (userWithSameUserName != null) 
                throw new ApiException($"Tên đăng nhập '{userName}' đã được sử dụng.");
            
            var userWithSameEmail = await _userManager.FindByEmailAsync(request.Email).ConfigureAwait(false);
            if (userWithSameEmail != null) 
                throw new ApiException($"Email '{request.Email}' đã được đăng ký trong hệ thống.");

            // 5. Tách Họ và Tên an toàn
            string hoTen = (request.HoTen ?? string.Empty).Trim();
            int firstSpaceIndex = hoTen.IndexOf(' ');
            string firstName = firstSpaceIndex > 0 ? hoTen[..firstSpaceIndex] : hoTen;
            string lastName = firstSpaceIndex > 0 ? hoTen[(firstSpaceIndex + 1)..].Trim() : string.Empty;

            // 6. Khởi tạo và lưu tài khoản Identity
            var user = new ApplicationUser
            {
                Email = request.Email,
                UserName = userName,
                FirstName = firstName,
                LastName = lastName
            };

            var result = await _userManager.CreateAsync(user, request.Password).ConfigureAwait(false);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new ApiException($"Đăng ký không thành công: {errors}");
            }

            // 7. Phân luồng đăng ký hồ sơ theo vai trò
            if (!string.IsNullOrWhiteSpace(request.InviteToken))
            {
                await RegisterInvitedNhanSuAsync(user, request).ConfigureAwait(false);
            }
            else if (request.Role == ungVienRole)
            {
                await RegisterCandidateAsync(user).ConfigureAwait(false);
            }
            else
            {
                await RegisterEmployerAsync(user, request).ConfigureAwait(false);
            }

            // 8. Tạo mã xác nhận và gửi email
            var verificationUri = await SendVerificationEmail(user, origin).ConfigureAwait(false);
            await _emailService.SendAsync(new EmailRequest
            {
                From = "noreply@yourdomain.com",
                To = user.Email,
                Body = $"Vui lòng xác nhận tài khoản của bạn bằng cách nhấn vào liên kết: {verificationUri}",
                Subject = "Xác nhận Đăng ký Tài khoản"
            }).ConfigureAwait(false);

            return new Response<string>(user.Id, $"Người dùng đã đăng ký thành công. Vui lòng xác nhận tài khoản qua email: {verificationUri}");
        }

        ///<summary>
        /// Khởi tạo thưc thể nguoiDung với Role là UNG_VIEN
        /// Chức năng: tạo một bản ghi nguoiDung trong cơ sở dữ liệu nghiệp sau khi tạo tài khoản Identity
        /// Vai trò:  Xác lập quyền hạn hệ thống
        ///           Khởi tại thực thể nguoiDung 
        ///           Chủ động không tạo hoSoUngVien để người dùng hoàn thiện sau khi sign in thành công.
        /// </summary>
        private async Task RegisterCandidateAsync(ApplicationUser user) {
            // thêm .ConfigureAwait(false) để tránh chuyển ngữ cảnh luồng khi đang làm việc
            await _userManager.AddToRoleAsync(user, VaiTroNguoiDung.UNG_VIEN.ToString()).ConfigureAwait(false);

            var nd = new NguoiDung {
                ApplicationUserId = user.Id,
                VaiTro = VaiTroNguoiDung.UNG_VIEN,
                IsActive = true
            };

            await _appContext.NguoiDungs.AddAsync(nd).ConfigureAwait(false);
            await _appContext.SaveChangesAsync().ConfigureAwait(false);
            // KHÔNG tạo hoSoUngVien ở đây - để user tự tạo sau login
        }

        /// <summary>
        /// Khởi tạo thực thể nguoiDung với vai trò NHA_TUYEN_DUNG
        /// Chức năng: tạo một bản ghi nguoiDung trong cơ sở dữ liệu nghiệp sau khi tạo tài khoản Identity
        /// Vai trò : Xác lập quyền hạn hệ thống
        ///           Khởi tại thực thể doanhNghiep 
        ///           Tạo nguoiDung va hoSoNhaTuyenDung là JoinEntity giữa nguoiDungId và doanhNghiepId
        /// </summary>
        private async Task RegisterEmployerAsync(ApplicationUser user, YeuCauDangKy request)
        {
            // 1. Gán vai trò Người đại diện trong Identity Context
            await _userManager.AddToRoleAsync(user, VaiTroNguoiDung.NGUOI_DAI_DIEN.ToString()).ConfigureAwait(false);

            // 2. Khởi tạo thực thể Doanh nghiệp
            var dn = new DoanhNghiep
            {
                TenDoanhNghiep = request.TenDoanhNghiep,
                DiaChi = request.DiaChiDoanhNghiep,
                MoTa = request.MoTaDoanhNghiep,
                Website = request.Website,
                LogoUrl = request.LogoUrl,
                MaSoThue = request.MaSoThue,
                LinhVucHoatDong = request.LinhVucHoatDong,
                QuyMoNhanSu = request.QuyMoNhanSu
            };

            // 3. Khởi tạo thực thể Người dùng (Domain Context)
            var nd = new NguoiDung
            {
                ApplicationUserId = user.Id,
                VaiTro = VaiTroNguoiDung.NGUOI_DAI_DIEN,
                IsActive = true
            };

            // 4. Khởi tạo Hồ sơ Người đại diện và liên kết thông qua Navigation Properties
            var hs = new HoSoNhaTuyenDung
            {
                NguoiDung = nd,
                DoanhNghiep = dn,
                HoTen = request.HoTen,
                SDT = request.SoDienThoai,
                ChucVu = request.ChucVu
            };

            // 5. Thêm thực thể gốc vào DbContext và lưu tất cả trong một Transaction duy nhất
            await _appContext.HoSoNhaTuyenDungs.AddAsync(hs).ConfigureAwait(false);
            await _appContext.SaveChangesAsync().ConfigureAwait(false);
        }

        /// <summary>
        /// Khởi tạo thực thể nguoiDung với vai trò NHAN_SU thông qua lời mời
        /// Chức năng: người được mời đăng ký tài khoản mới kèm token lời mời,
        ///            hệ thống tạo NguoiDung(NHAN_SU) + HoSoNhaTuyenDung liên kết DoanhNghiep, thêm role.
        /// </summary>
        private async Task RegisterInvitedNhanSuAsync(ApplicationUser user, YeuCauDangKy request)
        {
            var invitation = await _appContext.LoiMoiNhanSus.FirstOrDefaultAsync(l => l.Token == request.InviteToken).ConfigureAwait(false);
            if (invitation == null)
                throw new ApiException("Lời mời không hợp lệ.");
            if (invitation.LoiMoi != TrangThaiLoiMoi.ChoXacNhan)
                throw new ApiException("Lời mời đã được xử lý.");
            if (invitation.NgayHetHan < DateTime.UtcNow)
                throw new ApiException("Lời mời đã hết hạn.");
            if (!string.Equals(invitation.Email, request.Email, StringComparison.OrdinalIgnoreCase))
                throw new ApiException("Email đăng ký không khớp với lời mời.");

            var nd = new NguoiDung
            {
                ApplicationUserId = user.Id,
                VaiTro = VaiTroNguoiDung.NHAN_SU,
                IsActive = true
            };

            var hs = new HoSoNhaTuyenDung
            {
                NguoiDung = nd,
                DoanhNghiepId = invitation.DoanhNghiepId,
                HoTen = request.HoTen,
                SDT = request.SoDienThoai,
                ChucVu = invitation.ChucVu
            };

            await _userManager.AddToRoleAsync(user, VaiTroNguoiDung.NHAN_SU.ToString()).ConfigureAwait(false);
            await _appContext.HoSoNhaTuyenDungs.AddAsync(hs).ConfigureAwait(false);
            await _appContext.SaveChangesAsync().ConfigureAwait(false);

            invitation.LoiMoi = TrangThaiLoiMoi.DaChapNhan;
            await _appContext.SaveChangesAsync().ConfigureAwait(false);
        }

        /// <summary>
        /// Người dùng đã có tài khoản chấp nhận lời mời -> trở thành NHAN_SU của doanh nghiệp.
        /// </summary>
        public async Task<Response<string>> AcceptInviteAsync(string token)
        {
            var invitation = await _appContext.LoiMoiNhanSus.FirstOrDefaultAsync(l => l.Token == token).ConfigureAwait(false);
            if (invitation == null)
                throw new ApiException("Lời mời không hợp lệ.");
            if (invitation.LoiMoi != TrangThaiLoiMoi.ChoXacNhan)
                throw new ApiException("Lời mời đã được xử lý.");
            if (invitation.NgayHetHan < DateTime.UtcNow)
                throw new ApiException("Lời mời đã hết hạn.");

            var user = await _userManager.FindByIdAsync(_authenticatedUserService.UserId).ConfigureAwait(false);
            if (user == null)
                throw new ApiException("Không xác định được tài khoản.");
            if (!string.Equals(user.Email, invitation.Email, StringComparison.OrdinalIgnoreCase))
                throw new ApiException("Email tài khoản không khớp với lời mời.");

            var nd = await _appContext.NguoiDungs.FirstOrDefaultAsync(n => n.ApplicationUserId == user.Id).ConfigureAwait(false);
            if (nd == null)
            {
                nd = new NguoiDung { ApplicationUserId = user.Id, IsActive = true };
                await _appContext.NguoiDungs.AddAsync(nd).ConfigureAwait(false);
            }
            nd.VaiTro = VaiTroNguoiDung.NHAN_SU;

            var existing = await _appContext.HoSoNhaTuyenDungs.FirstOrDefaultAsync(h => h.NguoiDungId == nd.Id).ConfigureAwait(false);
            if (existing != null)
                throw new ApiException("Bạn đã thuộc một doanh nghiệp.");

            var hs = new HoSoNhaTuyenDung
            {
                NguoiDung = nd,
                DoanhNghiepId = invitation.DoanhNghiepId,
                HoTen = invitation.HoTen ?? user.UserName,
                SDT = string.Empty,
                ChucVu = invitation.ChucVu
            };

            await _appContext.HoSoNhaTuyenDungs.AddAsync(hs).ConfigureAwait(false);
            if (!await _userManager.IsInRoleAsync(user, VaiTroNguoiDung.NHAN_SU.ToString()).ConfigureAwait(false))
                await _userManager.AddToRoleAsync(user, VaiTroNguoiDung.NHAN_SU.ToString()).ConfigureAwait(false);

            invitation.LoiMoi = TrangThaiLoiMoi.DaChapNhan;
            await _appContext.SaveChangesAsync().ConfigureAwait(false);

            return new Response<string>(user.Id, "Đã chấp nhận lời mời. Bạn hiện là Nhân sự của doanh nghiệp.");
        }
        
        /// <summary>
        /// get lấy quyền của role
        /// </summary>
        private async Task<string> GetPermissionOfRole(string roleName)
        {
            // 1. Tìm kiếm vai trò và kiểm tra an toàn
            var role = await _roleManager.FindByNameAsync(roleName).ConfigureAwait(false);
            if (role == null)
            {
                return JsonConvert.SerializeObject(new
                {
                    role = roleName,
                    permissions = Array.Empty<RolePermission>()
                });
            }

            // 2. Truy vấn danh sách Claim bất đồng bộ (Non-blocking I/O)
            var roleClaimsForRole = await _context.RoleClaims
                .Where(rc => rc.RoleId == role.Id)
                .ToListAsync()
                .ConfigureAwait(false);

            // 3. Chuyển đổi dữ liệu sang danh sách RolePermission bằng LINQ Projection
            
            var rolePermissions = roleClaimsForRole
                    .Select(item => new RolePermission(
                        item.ClaimType ?? string.Empty,
                        !string.IsNullOrEmpty(item.ClaimValue)
                            ? item.ClaimValue.Split('#', StringSplitOptions.RemoveEmptyEntries)
                            : []
                    ))
                    .ToList();

            // 4. Tuần tự hóa đối tượng sang chuỗi JSON
            return JsonConvert.SerializeObject(new
            {
                role = roleName,
                permissions = rolePermissions
            });
        }

        ///<summary>
        /// Hàm hỗ trợ cho AuthenticateAsync : phát hành danh tính số và ký số mật mã học (Cryptographic Security Token Issuer)
        /// Vai trò : Get all dl người dùng từ Identity(userClaims),(roles) và xuống RolePermission để đóng gói vào payload.
        ///           Đính kèm Jti(mã định danh duy nhất chống Rellay Attack) và ipAdress của client để lk token với ngữ cảnh mạng tại thời điểm tạo
        ///           use HmacSha256 với JWTSettings.Key, quy định rõ đơn vi cấp phát (Issuer), đơn vị thụ hưởng (Audience) và thời gian tồn tại của Token(DurationInMinutes)
        /// </summary>
        private async Task<JwtSecurityToken> GenerateJWToken(ApplicationUser user)
        {
            // 1. Lấy dữ liệu Claims và Roles bất đồng bộ
            var userClaimsTask = _userManager.GetClaimsAsync(user);
            var rolesTask = _userManager.GetRolesAsync(user);

            await Task.WhenAll(userClaimsTask, rolesTask).ConfigureAwait(false);

            var userClaims = await userClaimsTask.ConfigureAwait(false);
            var roles = await rolesTask.ConfigureAwait(false);

            // 2. Lấy quyền của tất cả các vai trò một cách đồng thời (Concurrent Processing)
            var rolePermissionTasks = roles.Select(async role =>
            {
                var permissionJson = await GetPermissionOfRole(role).ConfigureAwait(false);
                return new Claim("roles", permissionJson);
            });

            var roleClaims = await Task.WhenAll(rolePermissionTasks).ConfigureAwait(false);

            // 3. Lấy địa chỉ IP an toàn
            string ipAddress = IpHelper.GetIpAddress() ?? "N/A";
            string primaryPermission = roles.FirstOrDefault() ?? string.Empty;

            // 4. Khởi tạo danh sách Claims tối ưu hóa bộ nhớ
            var claims = new List<Claim>(6 + userClaims.Count + roleClaims.Length)
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserName ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                new Claim("uid", user.Id),
                new Claim("ip", ipAddress),
                new Claim("permission", primaryPermission)
            };

            claims.AddRange(userClaims);
            claims.AddRange(roleClaims);

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            // 5. Thiết lập chữ ký điện tử
            var symmetricSecurityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
            var signingCredentials = new SigningCredentials(symmetricSecurityKey, SecurityAlgorithms.HmacSha256);

            // 6. Đóng gói JWT Token hoàn chỉnh
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
                return new Response<string>(user.Id, message: $"Tài khoản đã được xác nhận cho{user.Email}. You can now use the /api/Account/authenticate endpoint.");
            }
            else
            {
                throw new ApiException($"Đã xảy ra lỗi khi xác nhận {user.Email}.");
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
                Body = $"Mã đặt lại của bạn là - {code}",
                To = model.Email,
                Subject = "Đặt lại Mật khẩu",
            };
            await _emailService.SendAsync(emailRequest);
        }

        public async Task<Response<string>> ResetPassword(YeuCauGuiLaiXacMinh model)
        {
            var account = await _userManager.FindByEmailAsync(model.Email);
            if (account == null) throw new ApiException($"Không có tài khoản nào được đăng ký với {model.Email}.");
            var result = await _userManager.ResetPasswordAsync(account, model.Token, model.Password);
            if (result.Succeeded)
            {
                return new Response<string>(model.Email, message: $"Mật khẩu đã được đặt lại.");
            }
            else
            {
                throw new ApiException($"Đã xảy ra lỗi khi đặt lại mật khẩu.");
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
                Body = $"Vui lòng xác nhận tài khoản của bạn: {verificationUri}", 
                Subject = "Xác nhận Đăng ký" 
            });
        }
        public async Task<Response<AuthenticationResponse>> RotateRefreshTokenAsync(string token, string ipAddress)
        {
            // 1. Tìm user có chứa refresh token tương ứng
            // Lưu ý: Cần viết thêm hàm GetUserByRefreshTokenAsync trong UserManager hoặc truy vấn trực tiếp qua _context
            var user = _context.Users.SingleOrDefault(u => u.RefreshTokens.Any(t => t.Token == token));
            
            if (user == null)
                throw new ApiException("Token không tồn tại.");

            var refreshToken = user.RefreshTokens.Single(x => x.Token == token);

            // 2. Kiểm tra token có hợp lệ không (đã hết hạn, hoặc bị thu hồi chưa)
            if (!refreshToken.IsActive)
                throw new ApiException("Token không hợp lệ hoặc đã hết hạn.");

            // 3. Thu hồi (Revoke) token cũ
            refreshToken.Revoked = DateTime.UtcNow;
            refreshToken.RevokedByIp = ipAddress;
            refreshToken.ReplacedByToken = "New Token"; // Sẽ cập nhật chuỗi ở bước dưới

            // 4. Sinh ra cặp JWT và Refresh Token mới
            var newRefreshToken = GenerateRefreshToken(ipAddress);
            refreshToken.ReplacedByToken = newRefreshToken.Token; // Gắn thông tin xoay vòng
            user.RefreshTokens.Add(newRefreshToken);

            await _userManager.UpdateAsync(user);

            JwtSecurityToken jwtSecurityToken = await GenerateJWToken(user);

            // 5. Trả về kết quả
            AuthenticationResponse response = new AuthenticationResponse
            {
                Id = user.Id,
                JWToken = new JwtSecurityTokenHandler().WriteToken(jwtSecurityToken),
                Email = user.Email,
                UserName = user.UserName,
                Roles = (await _userManager.GetRolesAsync(user)).ToList(),
                IsVerified = user.EmailConfirmed,
                RefreshToken = newRefreshToken.Token
            };

            return new Response<AuthenticationResponse>(response, "Token đã được làm mới.");
        }

        public async Task<Response<string>> RevokeRefreshTokenAsync(string token, string ipAddress)
        {
            var user = _context.Users.SingleOrDefault(u => u.RefreshTokens.Any(t => t.Token == token));
            if (user == null)
                throw new ApiException("Token không tồn tại.");

            var refreshToken = user.RefreshTokens.Single(x => x.Token == token);

            if (!refreshToken.IsActive)
                throw new ApiException("Token này đã bị vô hiệu hóa từ trước.");

            // Đánh dấu thu hồi
            refreshToken.Revoked = DateTime.UtcNow;
            refreshToken.RevokedByIp = ipAddress;

            await _userManager.UpdateAsync(user);

            return new Response<string>(null, "Token đã bị thu hồi thành công.");
        }

        public async Task<Response<AuthenticationResponse>> RefreshTokenAsync(string token, string ipAddress)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                throw new ApiException("Mã Token không được để trống.");
            }

            // 1. Truy vấn người dùng sở hữu Refresh Token tương ứng
            var user = await _context.Users
                .Include(u => u.RefreshTokens)
                .SingleOrDefaultAsync(u => u.RefreshTokens.Any(t => t.Token == token))
                .ConfigureAwait(false);

            if (user == null)
            {
                throw new ApiException("Mã Token không tồn tại trong hệ thống.");
            }

            var oldRefreshToken = user.RefreshTokens.Single(x => x.Token == token);

            // 2. Kiểm tra tính hợp lệ của Token (Chưa bị thu hồi và chưa hết hạn)
            if (!oldRefreshToken.IsActive)
            {
                throw new ApiException("Mã Token không hợp lệ hoặc đã hết hạn.");
            }

            // 3. Thực hiện xoay vòng Token (Revoke token cũ và cấp token mới)
            var newRefreshToken = GenerateRefreshToken(ipAddress);

            oldRefreshToken.Revoked = DateTime.UtcNow;
            oldRefreshToken.RevokedByIp = ipAddress;
            oldRefreshToken.ReplacedByToken = newRefreshToken.Token;

            // Dọn dẹp token rác quá hạn và thêm token mới
            user.RefreshTokens.RemoveAll(t => !t.IsActive && t.Created.AddDays(30) <= DateTime.UtcNow);
            user.RefreshTokens.Add(newRefreshToken);

            await _userManager.UpdateAsync(user).ConfigureAwait(false);

            // 4. Sinh Access Token (JWT) mới cùng danh sách Roles
            var jwtSecurityToken = await GenerateJWToken(user).ConfigureAwait(false);
            var rolesList = await _userManager.GetRolesAsync(user).ConfigureAwait(false);

            // 5. Đóng gói AuthenticationResponse
            var response = new AuthenticationResponse
            {
                Id = user.Id,
                JWToken = new JwtSecurityTokenHandler().WriteToken(jwtSecurityToken),
                Email = user.Email,
                UserName = user.UserName,
                Roles = rolesList.ToList(),
                IsVerified = user.EmailConfirmed,
                RefreshToken = newRefreshToken.Token
            };

            return new Response<AuthenticationResponse>(response, "Làm mới Token thành công.");
        }
    }

}
