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
using Microsoft.Extensions.Logging;
using Google.Apis.Auth;

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
        private readonly IOptions<GoogleSettings> _googleSettings;
        private readonly ILogger<AccountService> _logger;
        public AccountService(
            IdentityContext context,
            IApplicationDbContext appContext,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IOptions<JWTSettings> jwtSettings,
            IDateTimeService dateTimeService,
            SignInManager<ApplicationUser> signInManager,
            IEmailService emailService,
            IAuthenticatedUserService authenticatedUserService,
            IOptions<GoogleSettings> googleSettings,
            ILogger<AccountService> logger)
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
            _googleSettings = googleSettings;
            _logger = logger;
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
            await EnsureAccountEnabledAsync(user, requireVerified: false);
            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
            if (result.IsLockedOut || await _userManager.IsLockedOutAsync(user))
            {
                throw new ApiException($"Tài khoản '{request.Email}' đã bị khóa. Vui lòng liên hệ quản trị viên.");
            }
            if (!result.Succeeded)
            {
                throw new ApiException($"Thông tin đăng nhập không hợp lệ cho '{request.Email}'.");
            }

            if (!user.EmailConfirmed)
            {
                throw new ApiException(
                    "Email chưa được xác minh. Vui lòng kiểm tra hộp thư hoặc gửi lại email xác minh.");
            }
           
            // 1. Khởi tạo Access Token và Refresh Token
            JwtSecurityToken jwtSecurityToken = await GenerateJWToken(user).ConfigureAwait(false);
            var refreshToken = GenerateRefreshToken(ipAddress);

            // 2. Quản lý danh sách Token và lưu trữ vào CSDL
            await _context.Entry(user).Collection(x => x.RefreshTokens).LoadAsync();
            user.RefreshTokens ??= new List<RefreshToken>();
            user.RefreshTokens.RemoveAll(t => !t.IsActive && t.Created.AddDays(30) <= DateTime.UtcNow);
            user.RefreshTokens.Add(refreshToken);

            EnsureIdentityResult(await _userManager.UpdateAsync(user).ConfigureAwait(false));

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
            request.Email = request.Email.Trim();
            request.Role = request.Role.Trim().ToUpperInvariant();
            if (!string.IsNullOrWhiteSpace(request.MaSoThue) && await _appContext.DoanhNghieps
                .AnyAsync(x => x.MaSoThue == request.MaSoThue.Trim()))
                throw new ApiException("Mã số thuế đã được sử dụng.");
            // 1. Kiểm tra tính hợp lệ của vai trò
            string ungVienRole = VaiTroNguoiDung.UNG_VIEN.ToString();
            string daidienRole = VaiTroNguoiDung.NGUOI_DAI_DIEN.ToString();

            if (string.IsNullOrWhiteSpace(request.InviteToken) || request.InviteToken == "string")
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

            // 4b. Validate lời mời TRƯỚC khi tạo Identity user — tránh account mồ côi
            // (trước đây user được tạo ở bước 6 rồi mới validate ở RegisterInvitedNhanSuAsync,
            // token hết hạn/sai email để lại account chiếm email nhưng không role/profile).
            LoiMoiNhanSu inviteToConsume = null;
            bool isInviteFlow = !string.IsNullOrWhiteSpace(request.InviteToken) && request.InviteToken != "string";
            if (isInviteFlow)
            {
                inviteToConsume = await _appContext.LoiMoiNhanSus
                    .FirstOrDefaultAsync(l => l.Token == request.InviteToken).ConfigureAwait(false);
                if (inviteToConsume == null)
                    throw new ApiException("Lời mời không hợp lệ.");
                if (inviteToConsume.LoiMoi != TrangThaiLoiMoi.ChoXacNhan)
                    throw new ApiException("Lời mời đã được xử lý.");
                if (inviteToConsume.NgayHetHan < DateTime.UtcNow)
                    throw new ApiException("Lời mời đã hết hạn.");
                if (!string.Equals(inviteToConsume.Email, request.Email, StringComparison.OrdinalIgnoreCase))
                    throw new ApiException("Email đăng ký không khớp với lời mời.");
            }

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

            // Compensate Identity creation if domain provisioning fails.
            try
            {
            if (!string.IsNullOrWhiteSpace(request.InviteToken) && request.InviteToken != "string")
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

            }
            catch
            {
                await _userManager.DeleteAsync(user).ConfigureAwait(false);
                throw;
            }
            // 8. Tạo mã xác nhận và gửi email.
            // EmailConfirmed phải giữ false cho tới khi người dùng bấm link xác nhận.
            try
            {
                var verificationUri = await SendVerificationEmail(user, origin).ConfigureAwait(false);
                await _emailService.SendAsync(new EmailRequest
                {
                    From = null,
                    To = user.Email,
                    Body = $"Vui lòng xác nhận tài khoản của bạn bằng cách nhấn vào liên kết: {verificationUri}",
                    Subject = "Xác nhận Đăng ký Tài khoản"
                }).ConfigureAwait(false);
                _logger.LogInformation(
                    "Verification email sent for user {UserId}",
                    user.Id);
            }
            catch (Exception ex)
            {
                // Không auto-confirm khi SMTP lỗi: người dùng phải gửi lại email.
                _logger.LogWarning(
                    ex,
                    "Gửi email xác thực thất bại cho {Email}",
                    user.Email);
            }

            return new Response<string>(
                user.Id,
                "Tài khoản đã được tạo. Vui lòng kiểm tra email để xác minh hoặc gửi lại email xác minh.");
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
            EnsureIdentityResult(await _userManager.AddToRoleAsync(user, VaiTroNguoiDung.UNG_VIEN.ToString()).ConfigureAwait(false));

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
            EnsureIdentityResult(await _userManager.AddToRoleAsync(user, VaiTroNguoiDung.NGUOI_DAI_DIEN.ToString()).ConfigureAwait(false));

            // Optional tax codes must be stored as NULL, not an empty string,
            // otherwise the unique index rejects every later registration without an MST.
            var maSoThue = string.IsNullOrWhiteSpace(request.MaSoThue)
                ? null
                : request.MaSoThue.Trim();

            // 1b. 1-1 nghiêm ngặt: chặn trùng MST ngay từ lúc đăng ký.
            if (maSoThue != null &&
                await _appContext.DoanhNghieps.AnyAsync(d => d.MaSoThue == maSoThue).ConfigureAwait(false))
                throw new ApiException($"Mã số thuế '{maSoThue}' đã được sử dụng.");

            // 2. Khởi tạo thực thể Doanh nghiệp
            var dn = new DoanhNghiep
            {
                TenDoanhNghiep = request.TenDoanhNghiep,
                DiaChi = request.DiaChiDoanhNghiep,
                MoTa = request.MoTaDoanhNghiep,
                Website = request.Website,
                LogoUrl = request.LogoUrl,
                MaSoThue = maSoThue,
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

            // 3b. Gắn owner 1-1: DN này thuộc về đúng NGUOI_DAI_DIEN vừa đăng ký.
            dn.NguoiDaiDien = nd;

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
            var invitation = await _appContext.LoiMoiNhanSus.AsTracking().FirstOrDefaultAsync(l => l.Token == request.InviteToken).ConfigureAwait(false);
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

            EnsureIdentityResult(await _userManager.AddToRoleAsync(user, VaiTroNguoiDung.NHAN_SU.ToString()).ConfigureAwait(false));
            await _appContext.HoSoNhaTuyenDungs.AddAsync(hs).ConfigureAwait(false);
            invitation.LoiMoi = TrangThaiLoiMoi.DaChapNhan;
            await _appContext.SaveChangesAsync().ConfigureAwait(false);
        }

        /// <summary>
        /// Người dùng đã có tài khoản chấp nhận lời mời -> trở thành NHAN_SU của doanh nghiệp.
        /// </summary>
        public async Task<Response<string>> AcceptInviteAsync(string token)
        {
            var invitation = await _appContext.LoiMoiNhanSus.AsTracking().FirstOrDefaultAsync(l => l.Token == token).ConfigureAwait(false);
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

            await EnsureAccountEnabledAsync(user);
            var nd = await _appContext.NguoiDungs.AsTracking().FirstOrDefaultAsync(n => n.ApplicationUserId == user.Id).ConfigureAwait(false);
            if (nd != null && nd.VaiTro != VaiTroNguoiDung.UNG_VIEN)
                throw new ApiException("Chỉ ứng viên chưa thuộc doanh nghiệp được nhận lời mời Nhân sự.");
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
            var nhanSuRole = VaiTroNguoiDung.NHAN_SU.ToString();
            var currentRoles = await _userManager.GetRolesAsync(user).ConfigureAwait(false);
            var obsoleteRoles = currentRoles
                .Where(role => !string.Equals(role, nhanSuRole, StringComparison.OrdinalIgnoreCase))
                .ToArray();
            if (obsoleteRoles.Length > 0)
                EnsureIdentityResult(await _userManager.RemoveFromRolesAsync(user, obsoleteRoles).ConfigureAwait(false));
            if (!currentRoles.Any(role => string.Equals(role, nhanSuRole, StringComparison.OrdinalIgnoreCase)))
                EnsureIdentityResult(await _userManager.AddToRoleAsync(user, nhanSuRole).ConfigureAwait(false));

            invitation.LoiMoi = TrangThaiLoiMoi.DaChapNhan;
            await _appContext.SaveChangesAsync().ConfigureAwait(false);

            return new Response<string>(user.Id, "Đã chấp nhận lời mời. Bạn hiện là Nhân sự của doanh nghiệp.");
        }

        /// <summary>
        /// Gỡ role NHAN_SU khỏi Identity khi nhân sự bị xóa khỏi doanh nghiệp,
        /// gán lại UNG_VIEN để họ không còn vào cổng employer / giữ quyền tintuyendungs.*.
        /// </summary>
        public async Task<Response<string>> RemoveNhanSuRoleAsync(string applicationUserId)
        {
            var user = await _userManager.FindByIdAsync(applicationUserId).ConfigureAwait(false);
            if (user == null)
                return new Response<string>(applicationUserId, "Không tìm thấy tài khoản Identity.");

            var nhanSuRole = VaiTroNguoiDung.NHAN_SU.ToString();
            var ungVienRole = VaiTroNguoiDung.UNG_VIEN.ToString();
            if (await _userManager.IsInRoleAsync(user, nhanSuRole).ConfigureAwait(false))
                await _userManager.RemoveFromRoleAsync(user, nhanSuRole).ConfigureAwait(false);
            if (!await _userManager.IsInRoleAsync(user, ungVienRole).ConfigureAwait(false))
                await _userManager.AddToRoleAsync(user, ungVienRole).ConfigureAwait(false);

            return new Response<string>(applicationUserId, "Đã gỡ quyền nhân sự.");
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
                    .Where(item => !string.IsNullOrWhiteSpace(item.ClaimValue))
                    .Select(item => new RolePermission(
                        item.ClaimType ?? string.Empty,
                        item.ClaimValue.Split('#', StringSplitOptions.RemoveEmptyEntries)
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
            var userClaims = await _userManager.GetClaimsAsync(user).ConfigureAwait(false);
            var roles = await _userManager.GetRolesAsync(user).ConfigureAwait(false);

            var roleClaims = new List<Claim>(roles.Count);
            if (roles.Count > 0)
            {
                // Read all role permissions in one query instead of doing two
                // sequential Identity queries for every role on each login.
                var roleClaimRows = await (
                    from role in _context.Roles
                    join claim in _context.RoleClaims on role.Id equals claim.RoleId
                    where roles.Contains(role.Name)
                    select new
                    {
                        Role = role.Name,
                        claim.ClaimType,
                        claim.ClaimValue
                    })
                    .ToListAsync()
                    .ConfigureAwait(false);

                foreach (var role in roles)
                {
                    var permissions = roleClaimRows
                        .Where(item => item.Role == role && !string.IsNullOrWhiteSpace(item.ClaimValue))
                        .Select(item => new RolePermission(
                            item.ClaimType ?? string.Empty,
                            item.ClaimValue.Split('#', StringSplitOptions.RemoveEmptyEntries)))
                        .ToList();
                    roleClaims.Add(new Claim(
                        "roles",
                        JsonConvert.SerializeObject(new { role, permissions })));
                }
            }

            // 3. Lấy địa chỉ IP an toàn
            string ipAddress = IpHelper.GetIpAddress() ?? "N/A";
            string primaryPermission = roles.FirstOrDefault() ?? string.Empty;

            // 4. Khởi tạo danh sách Claims tối ưu hóa bộ nhớ
            var claims = new List<Claim>(6 + userClaims.Count + roleClaims.Count)
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserName ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                new Claim("uid", user.Id),
                new Claim("sst", user.SecurityStamp ?? string.Empty),
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
            var keyBytes = Convert.FromBase64String(_jwtSettings.Key);
            var symmetricSecurityKey = new SymmetricSecurityKey(keyBytes);
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
            var randomBytes = RandomNumberGenerator.GetBytes(40);
            // convert random bytes to hex string
            return BitConverter.ToString(randomBytes).Replace("-", "");
        }

        private async Task<string> SendVerificationEmail(ApplicationUser user, string origin)
        {
            var code = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            code = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(code));
            var route = "confirm-email";
            var _enpointUri = new Uri(string.Concat($"{origin.TrimEnd('/')}/", route));
            var verificationUri = QueryHelpers.AddQueryString(_enpointUri.ToString(), "userId", user.Id);
            verificationUri = QueryHelpers.AddQueryString(verificationUri, "code", code);
            //Email Service Call Here
            return verificationUri;
        }

        public async Task<Response<string>> ConfirmEmailAsync(string userId, string code)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) throw new ApiException("Liên kết xác minh không hợp lệ.");
            try { code = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(code)); }
            catch (Exception ex) when (ex is FormatException or ArgumentException)
            { throw new ApiException("Mã xác minh không hợp lệ."); }
            var result = await _userManager.ConfirmEmailAsync(user, code);
            if (result.Succeeded)
            {
                return new Response<string>(user.Id, "Email đã được xác minh. Bạn có thể đăng nhập.");
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
            var resetUri = QueryHelpers.AddQueryString(
                $"{origin.TrimEnd('/')}/reset-password",
                new Dictionary<string, string> { ["email"] = model.Email, ["token"] = code });
            var emailRequest = new EmailRequest()
            {
                Body = $"<p>Bạn vừa yêu cầu đặt lại mật khẩu HIREAI.</p><p><a href=\"{resetUri}\">Đặt lại mật khẩu</a></p><p>Liên kết có thể hết hạn. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>",
                To = model.Email,
                Subject = "Đặt lại Mật khẩu",
            };
            try { await _emailService.SendAsync(emailRequest); }
            catch (Exception ex) { _logger.LogWarning(ex, "Không gửi được email đặt lại mật khẩu cho {UserId}", account.Id); }
        }

        public async Task<Response<string>> ResetPassword(YeuCauGuiLaiXacMinh model)
        {
            var account = await _userManager.FindByEmailAsync(model.Email);
            if (account == null) throw new ApiException($"Không có tài khoản nào được đăng ký với {model.Email}.");
            var result = await _userManager.ResetPasswordAsync(account, model.Token, model.Password);
            if (result.Succeeded)
            {
                await RevokeSessionsAsync(account);
                return new Response<string>(model.Email, "Mật khẩu đã được đặt lại. Vui lòng đăng nhập lại.");
            }
            else
            {
                throw new ApiException($"Đã xảy ra lỗi khi đặt lại mật khẩu.");
            }
        }

        public async Task<Response<string>> ChangePasswordAsync(YeuCauDoiMatKhau model)
        {
            if (string.IsNullOrWhiteSpace(_authenticatedUserService.UserId))
                throw new ApiException("Phiên đăng nhập không hợp lệ.", 401);

            var account = await _userManager.FindByIdAsync(_authenticatedUserService.UserId);
            if (account == null) throw new ApiException("Không tìm thấy tài khoản.", 404);
            if (model.MatKhauHienTai == model.MatKhauMoi)
                throw new ApiException("Mật khẩu mới phải khác mật khẩu hiện tại.");

            var result = await _userManager.ChangePasswordAsync(account, model.MatKhauHienTai, model.MatKhauMoi);
            if (!result.Succeeded)
            {
                var error = result.Errors.FirstOrDefault();
                throw new ApiException(error?.Code == "PasswordMismatch"
                    ? "Mật khẩu hiện tại không đúng."
                    : error?.Description ?? "Không thể đổi mật khẩu.");
            }

            await RevokeSessionsAsync(account);
            return new Response<string>(account.Email, "Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
        }

        public async Task ResendVerificationEmailAsync(string email, string origin)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null || user.EmailConfirmed) return;

            var verificationUri = await SendVerificationEmail(user, origin);
            await _emailService.SendAsync(new EmailRequest { 
                From = null,
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
            var user = await _context.Users.Include(x => x.RefreshTokens).SingleOrDefaultAsync(u => u.RefreshTokens.Any(t => t.Token == token));
            if (user == null)
                return new Response<string>(null, "Phiên đã được đăng xuất.");

            var refreshToken = user.RefreshTokens.Single(x => x.Token == token);

            if (!refreshToken.IsActive)
                return new Response<string>(null, "Phiên đã được đăng xuất.");

            // Đánh dấu thu hồi
            refreshToken.Revoked = DateTime.UtcNow;
            refreshToken.RevokedByIp = ipAddress;

            EnsureIdentityResult(await _userManager.UpdateAsync(user));

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
            await EnsureAccountEnabledAsync(user);

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

            EnsureIdentityResult(await _userManager.UpdateAsync(user).ConfigureAwait(false));

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

        public async Task<Response<AuthenticationResponse>> ExternalLoginAsync(ExternalAuthRequest request, string ipAddress)
        {
            var timer = System.Diagnostics.Stopwatch.StartNew();
            if (string.IsNullOrWhiteSpace(request?.IdToken))
                throw new ApiException("IdToken không được để trống.");

            var configuredClientId = _googleSettings.Value?.ClientId;
            if (string.IsNullOrWhiteSpace(configuredClientId))
            {
                _logger.LogError("GoogleSettings:ClientId chưa được cấu hình trên server.");
                throw new ApiException("Cấu hình Google ClientId trên server bị thiếu.");
            }

            // 1. Xác thực token từ nhà cung cấp bên ngoài (Google): trong thu vien Api.Auth.Google
            GoogleJsonWebSignature.Payload payload;
            try
            {
                var validationSettings = new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { configuredClientId },
                    // Dev: nới rất rộng để vượt lệch đồng hồ BE (đã thử 5m/10m vẫn "not yet valid" do w32tm chưa sync) — prod nên để 5m
                    IssuedAtClockTolerance = TimeSpan.FromMinutes(5),
                    ExpirationTimeClockTolerance = TimeSpan.FromMinutes(5)
                };
                // Log thêm iat/exp của token để chẩn lệch giờ
                string tokenIatInfo = "unknown";
                try
                {
                    var parts = request.IdToken.Split('.');
                    if (parts.Length == 3)
                    {
                        var payloadJson = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(parts[1].Replace('-', '+').Replace('_', '/').PadRight(parts[1].Length + (4 - parts[1].Length % 4) % 4, '=')));
                        using var doc = System.Text.Json.JsonDocument.Parse(payloadJson);
                        if (doc.RootElement.TryGetProperty("iat", out var iatEl) && doc.RootElement.TryGetProperty("exp", out var expEl))
                        {
                            var iat = DateTimeOffset.FromUnixTimeSeconds(iatEl.GetInt64()).UtcDateTime;
                            var exp = DateTimeOffset.FromUnixTimeSeconds(expEl.GetInt64()).UtcDateTime;
                            tokenIatInfo = $"iat={iat:O} exp={exp:O} skew={(iat - DateTime.UtcNow).TotalSeconds:F0}s";
                        }
                    }
                } catch { }
                _logger.LogInformation("Validating Google IdToken length={Len} for ClientId={ClientId} serverUtc={Utc} token={TokenInfo}", request.IdToken.Length, configuredClientId, DateTime.UtcNow, tokenIatInfo);
                payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, validationSettings).ConfigureAwait(false);
                _logger.LogInformation("Google token validated in {ElapsedMs} ms", timer.ElapsedMilliseconds);
            }
            catch (InvalidJwtException jwtEx)
            {
                // Log kèm serverUtc và hint sync clock
                _logger.LogWarning(jwtEx, "Google JWT validation failed: {Message} aud expected={Aud} serverUtc={Utc} tokenSnippet={Snippet} -> Gợi ý: chạy w32tm /resync hoặc Settings > Time > Sync now", jwtEx.Message, configuredClientId, DateTime.UtcNow, request.IdToken.Substring(0, Math.Min(60, request.IdToken.Length)));
                throw new ApiException($"Xác thực bên ngoài không thành công. Token không hợp lệ: {jwtEx.Message} (serverUtc={DateTime.UtcNow:O}, hãy đồng bộ đồng hồ BE: w32tm /resync)");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Google validation unexpected error: {Message} tokenSnippet={Snippet}", ex.Message, request.IdToken.Substring(0, Math.Min(60, request.IdToken.Length)));
                throw new ApiException($"Xác thực bên ngoài không thành công. Token không hợp lệ: {ex.Message}");
            }

            if (payload == null)
            {
                _logger.LogWarning("Google payload null after validation for tokenSnippet={Snippet}", request.IdToken.Substring(0, Math.Min(60, request.IdToken.Length)));
                throw new ApiException("Dữ liệu xác thực bên ngoài bị trống.");
            }

            _logger.LogInformation("Google payload OK email={Email} aud={Aud} iss={Iss}", payload.Email, payload.Audience, payload.Issuer);
            if (!payload.EmailVerified || string.IsNullOrWhiteSpace(payload.Email))
                throw new ApiException("Google chưa xác minh địa chỉ email này.");

            // 2. Kiểm tra xem người dùng đã tồn tại trong hệ thống chưa[cite: 3]
            var user = await _userManager.FindByEmailAsync(payload.Email).ConfigureAwait(false);
            var existingUser = user != null;
            _logger.LogInformation("Google user lookup completed in {ElapsedMs} ms; existing={Existing}", timer.ElapsedMilliseconds, existingUser);
            
            if (user == null)
            {
                // Khởi tạo tài khoản Identity mới nếu chưa tồn tại
                user = new ApplicationUser
                {
                    Email = payload.Email,
                    UserName = payload.Email,
                    FirstName = payload.GivenName,
                    LastName = payload.FamilyName,
                    EmailConfirmed = true // Xác nhận email ngay lập tức vì đã xác thực từ Google
                };

                var result = await _userManager.CreateAsync(user).ConfigureAwait(false);
                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    throw new ApiException($"Tạo tài khoản không thành công: {errors}");
                }

                // Tái sử dụng luồng tạo thực thể NguoiDung và gán vai trò UNG_VIEN[cite: 3]
                await RegisterCandidateAsync(user).ConfigureAwait(false);
                _logger.LogInformation("Google user provisioning completed in {ElapsedMs} ms", timer.ElapsedMilliseconds);
            }

            // 3. Sinh Access Token và Refresh Token[cite: 3]
            await EnsureAccountEnabledAsync(user, requireVerified: false);
            if (!user.EmailConfirmed)
            {
                user.EmailConfirmed = true;
                EnsureIdentityResult(await _userManager.UpdateAsync(user));
            }
            JwtSecurityToken jwtSecurityToken = await GenerateJWToken(user).ConfigureAwait(false);
            var refreshToken = GenerateRefreshToken(ipAddress);

            await _context.Entry(user).Collection(x => x.RefreshTokens).LoadAsync();
            user.RefreshTokens ??= new List<RefreshToken>();
            user.RefreshTokens.RemoveAll(t => !t.IsActive && t.Created.AddDays(30) <= DateTime.UtcNow);
            user.RefreshTokens.Add(refreshToken);

            EnsureIdentityResult(await _userManager.UpdateAsync(user).ConfigureAwait(false));

            var rolesList = await _userManager.GetRolesAsync(user).ConfigureAwait(false);

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

            _logger.LogInformation("Google external login completed in {ElapsedMs} ms; existing={Existing}", timer.ElapsedMilliseconds, existingUser);
            return new Response<AuthenticationResponse>(response, $"Đã xác thực {user.UserName} thông qua {request.Provider}.");
        }

        // Helper: Khởi tạo URL xác thực Magic Link
        private string BuildMagicLink(string token, string email, string origin)
        {
            var route = "magic-login";
            var endpointUri = new Uri(string.Concat($"{origin.TrimEnd('/')}/", route));
            
            var verificationUri = QueryHelpers.AddQueryString(endpointUri.ToString(), "token", token);
            verificationUri = QueryHelpers.AddQueryString(verificationUri, "email", email);
            verificationUri = QueryHelpers.AddQueryString(verificationUri, "mode", "magic");
            
            return verificationUri;
        }

        public async Task<Response<string>> RequestMagicLinkAsync(YeuCauMagicLink request, string origin)
        {
            // 1. Chuẩn hóa Email
            string email = request.Email.Trim().ToLowerInvariant();
            request.Role = request.Role?.Trim().ToUpperInvariant();
            if (request.Role is not ("UNG_VIEN" or "NGUOI_DAI_DIEN"))
                throw new ApiException("Magic link chỉ hỗ trợ đăng ký Ứng viên hoặc Người đại diện.");

            // 2. Vô hiệu hóa tất cả token cũ đang kích hoạt
            var oldTokens = await _context.MagicLinkTokens
                .Where(m => m.Email == email && !m.Used && m.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();

            foreach (var oldToken in oldTokens)
            {
                oldToken.Used = true;
            }

            // 3. Khởi tạo Token mới
            string token = Guid.NewGuid().ToString("N");
            var magicToken = new MagicLinkToken
            {
                Email = email,
                Token = token,
                Purpose = MagicLinkPurpose.PasswordLessLogin, // Gắn cứng theo nghiệp vụ đăng nhập[cite: 16]
                Role = request.Role, 
                ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                Used = false
            };

            // 4. Lưu CSDL
            await _context.MagicLinkTokens.AddAsync(magicToken);
            await _context.SaveChangesAsync();

            // 5. Build Link và Gửi Email
            string link = BuildMagicLink(token, email, origin);

            await _emailService.SendAsync(new EmailRequest
            {
                To = email,
                Subject = "Liên kết đăng nhập",
                Body = $"Nhấn <a href='{link}'>đăng nhập</a> (hết hạn trong 15 phút)"
            });

            // 7. Response chuẩn (Luôn trả về 200 để tránh rò rỉ thông tin tài khoản)
            return new Response<string>(null, "Nếu email tồn tại, liên kết đã được gửi. Vui lòng kiểm tra hộp thư.");
        }

        public async Task<Response<AuthenticationResponse>> MagicLoginAsync(DoiMagicLink request, string ipAddress)
        {
            // 1. Chuẩn hóa và truy vấn Token
            string email = request.Email.Trim().ToLowerInvariant();
            var magicToken = await _context.MagicLinkTokens
                .SingleOrDefaultAsync(m => m.Email == email && m.Token == request.Token);

            // 2. Kiểm tra tính hợp lệ
            if (magicToken == null || magicToken.Used || magicToken.IsExpired)
            {
                throw new ApiException("Liên kết không hợp lệ, đã hết hạn hoặc đã được sử dụng.");
            }

            // 3. Kiểm tra Người dùng
            var user = await _userManager.FindByEmailAsync(email);

            // 4. Khởi tạo User nếu chưa tồn tại
            if (user == null)
            {
                if (magicToken.Purpose == MagicLinkPurpose.PasswordLessLogin)
                {
                    string userName = $"{email.Split('@')[0]}_{Guid.NewGuid().ToString("N")[..6]}";
                    
                    user = new ApplicationUser
                    {
                        Email = email,
                        UserName = userName,
                        FirstName = userName, // Fallback do MagicLinkToken không lưu HoTen[cite: 15]
                        LastName = "User",
                        EmailConfirmed = true 
                    };

                    string randomPwd = Guid.NewGuid().ToString("N") + "!Aa1";
                    var createResult = await _userManager.CreateAsync(user, randomPwd);
                    
                    if (!createResult.Succeeded)
                    {
                        var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                        throw new ApiException($"Tạo tài khoản không thành công: {errors}");
                    }

                    // Phân nhánh tái sử dụng logic đăng ký[cite: 13]
                    if (magicToken.Role == VaiTroNguoiDung.UNG_VIEN.ToString())
                    {
                        await RegisterCandidateAsync(user);
                    }
                    else if (magicToken.Role == VaiTroNguoiDung.NGUOI_DAI_DIEN.ToString())
                    {
                        // Truyền mock request do MagicLinkToken không lưu thông tin doanh nghiệp[cite: 15]
                        var mockRequest = new YeuCauDangKy 
                        { 
                            TenDoanhNghiep = "Doanh nghiệp chưa cập nhật", 
                            DiaChiDoanhNghiep = "Chưa cập nhật", 
                            ChucVu = "Chưa cập nhật" 
                        };
                        await RegisterEmployerAsync(user, mockRequest);
                    }
                }
                else
                {
                    throw new ApiException("Tài khoản chưa tồn tại, vui lòng đăng ký.");
                }
            }

            // 5. Cấp phát Token
            await EnsureAccountEnabledAsync(user, requireVerified: false);
            if (!user.EmailConfirmed) user.EmailConfirmed = true;
            var jwtSecurityToken = await GenerateJWToken(user);
            var refreshToken = GenerateRefreshToken(ipAddress);

            await _context.Entry(user).Collection(x => x.RefreshTokens).LoadAsync();
            user.RefreshTokens ??= new List<RefreshToken>();
            user.RefreshTokens.RemoveAll(t => !t.IsActive && t.Created.AddDays(30) <= DateTime.UtcNow);
            user.RefreshTokens.Add(refreshToken);
            
            EnsureIdentityResult(await _userManager.UpdateAsync(user));

            // 6. Hủy Token xác thực
            magicToken.Used = true;
            magicToken.UsedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var rolesList = await _userManager.GetRolesAsync(user);

            // 7. Đóng gói AuthenticationResponse[cite: 13]
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

            return new Response<AuthenticationResponse>(response, "Đăng nhập thành công.");
        }

        private static void EnsureIdentityResult(IdentityResult result)
        {
            if (!result.Succeeded)
                throw new ApiException(string.Join("; ", result.Errors.Select(x => x.Description)));
        }

        private async Task EnsureAccountEnabledAsync(ApplicationUser user, bool requireVerified = true)
        {
            if (await _userManager.IsLockedOutAsync(user)) throw new ApiException("Tài khoản đã bị khóa.", 403);
            var profile = await _appContext.NguoiDungs.AsNoTracking().FirstOrDefaultAsync(x => x.ApplicationUserId == user.Id);
            if (profile == null || !profile.IsActive) throw new ApiException("Tài khoản không hoạt động.", 403);
            if (requireVerified && !user.EmailConfirmed) throw new ApiException("Vui lòng xác minh email trước khi đăng nhập.");
            if ((await _userManager.GetRolesAsync(user)).Count == 0) throw new ApiException("Tài khoản chưa được phân vai trò.", 403);
        }

        private async Task RevokeSessionsAsync(ApplicationUser user)
        {
            await _context.Entry(user).Collection(x => x.RefreshTokens).LoadAsync();
            foreach (var token in user.RefreshTokens.Where(x => x.IsActive)) token.Revoked = DateTime.UtcNow;
            EnsureIdentityResult(await _userManager.UpdateAsync(user));
        }
    }

}
