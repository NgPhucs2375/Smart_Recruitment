using Application.DTOs.NguoiDung;
using Application.Features.NguoiDung.Queries.GetAllNguoiDungs;
using Application.Features.NguoiDung.Queries.GetNguoiDungById;
using Application.Features.NguoiDung.Commands.CreateNguoiDung;
using Application.Features.NguoiDung.Commands.UpdateNguoiDung;
using Application.Features.NguoiDung.Commands.DeleteNguoiDung;
using Application.Wrappers;
using Application.Interfaces;
using Application.Validation;
using Domain.Enums;
using Infrastructure.Identity.Contexts;
using Infrastructure.Identity.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Identity;
using System.Text.RegularExpressions;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Authorize(Roles = "QUAN_TRI_VIEN")]
    [Route("api/nguoidungs")]
    public class NguoiDungController : BaseApiController
    {
        private const string AdminTestPassword = "Test@123";
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IApplicationDbContext _applicationContext;

        public NguoiDungController(
            IWebHostEnvironment hostingEnvironment,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IApplicationDbContext applicationContext) : base(hostingEnvironment)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _applicationContext = applicationContext;
        }

        // GET: api/nguoidung
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] GetAllNguoiDungsParameter filter)
        {
            return await EnforcePermissionAndExecute("nguoidungs", "list", async () =>
            {
                return Ok(await Mediator.Send(new GetAllNguoiDungsQuery()
                {
                    _end = filter._end,
                    _start = filter._start,
                    _order = filter._order,
                    _sort = filter._sort,
                    _filter = filter._filter
                }));
            });
        }

        // GET: api/nguoidungs/admin-list?search=
        // Danh sách cho màn hình quản trị: gộp hồ sơ NguoiDung với tài khoản
        // đăng nhập (email/username/trạng thái khóa) để admin biết ai là ai.
        [HttpGet("admin-list")]
        public async Task<IActionResult> AdminList([FromQuery] string? search = null)
        {
            return await EnforcePermissionAndExecute("nguoidungs", "list", async () =>
            {
                var result = await Mediator.Send(new GetAllNguoiDungsQuery());
                var rows = result?.Data ?? new List<GetAllNguoiDungsViewModel>();

                var appIds = rows
                    .Select(x => x.ApplicationUserId)
                    .Where(id => !string.IsNullOrWhiteSpace(id))
                    .Distinct()
                    .ToList();

                var identityContext = HttpContext.RequestServices
                    .GetRequiredService<IdentityContext>();

                var users = await identityContext.Users
                    .AsNoTracking()
                    .Where(u => appIds.Contains(u.Id))
                    .Select(u => new { u.Id, u.Email, u.UserName, u.LockoutEnd, u.FirstName, u.LastName, u.PhoneNumber })
                    .ToDictionaryAsync(u => u.Id);

                var kw = search?.Trim().ToLowerInvariant();

                var list = rows
                    .Select(x =>
                    {
                        users.TryGetValue(x.ApplicationUserId ?? string.Empty, out var u);
                        return new AdminNguoiDungDto
                        {
                            Id = x.Id,
                            Email = u?.Email,
                            UserName = u?.UserName,
                            HoTen = string.Join(" ", new[] { u?.FirstName, u?.LastName }.Where(s => !string.IsNullOrWhiteSpace(s))),
                            PhoneNumber = u?.PhoneNumber,
                            ApplicationUserId = x.ApplicationUserId,
                            VaiTro = x.VaiTro,
                            IsActive = x.IsActive,
                            IsLocked = u?.LockoutEnd.HasValue == true
                                && u.LockoutEnd.Value > DateTimeOffset.UtcNow
                        };
                    })
                    .Where(x => string.IsNullOrWhiteSpace(kw)
                        || (x.Email != null && x.Email.ToLowerInvariant().Contains(kw))
                        || (x.UserName != null && x.UserName.ToLowerInvariant().Contains(kw))
                        || (x.HoTen != null && x.HoTen.ToLowerInvariant().Contains(kw))
                        || (x.PhoneNumber != null && x.PhoneNumber.Contains(kw)))
                    .OrderBy(x => x.Id)
                    .ToList();

                return Ok(new Response<List<AdminNguoiDungDto>>(list));
            });
        }

        // GET: api/nguoidung/show/5
        [HttpGet("show/{id}")]
        public async Task<IActionResult> Show(int id)
        {
            return await EnforcePermissionAndExecute("nguoidungs", "show", async () =>
            {
                return Ok(await Mediator.Send(new GetNguoiDungByIdQuery() { Id = id }));
            });
        }

        // POST: api/nguoidung
        [HttpPost]
        public async Task<IActionResult> Create(CreateNguoiDungCommand command)
        {
            return await EnforcePermissionAndExecute("nguoidungs", "create", async () =>
            {
                return Ok(await Mediator.Send(command));
            });
        }

        // POST: api/nguoidungs/admin-create
        // Luồng tạo nhanh cho môi trường test: tạo Identity và hồ sơ ứng dụng cùng lúc.
        [HttpPost("admin-create")]
        public async Task<IActionResult> AdminCreate([FromBody] AdminCreateNguoiDungRequest request)
        {
            return await EnforcePermissionAndExecute("nguoidungs", "create", async () =>
            {
                var email = request.Email?.Trim();
                var userName = request.UserName?.Trim();
                var fullName = request.HoTen?.Trim();

                if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(userName) || string.IsNullOrWhiteSpace(fullName))
                    return BadRequest(new Response<object>("Email, tên đăng nhập và họ tên là bắt buộc."));
                if (fullName.Length < 2 || fullName.Length > 100)
                    return BadRequest(new Response<object>("Họ tên phải có từ 2 đến 100 ký tự."));
                if (!InputValidation.IsEmail(email))
                    return BadRequest(new Response<object>("Email không đúng định dạng."));
                if (!Regex.IsMatch(userName, @"^[A-Za-z0-9._-]{3,50}$"))
                    return BadRequest(new Response<object>("Tên đăng nhập chỉ gồm chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang; dài 3-50 ký tự."));
                var phoneNumber = request.PhoneNumber?.Trim();
                if (!string.IsNullOrEmpty(phoneNumber) && !InputValidation.IsVietnameseMobilePhone(phoneNumber))
                    return BadRequest(new Response<object>("Số điện thoại phải gồm đúng 10 chữ số, bắt đầu bằng 03/05/07/08/09."));
                if (!Enum.IsDefined(typeof(VaiTroNguoiDung), request.VaiTro))
                    return BadRequest(new Response<object>("Vai trò không hợp lệ."));

                if (await _userManager.FindByNameAsync(userName) != null)
                    return Conflict(new Response<object>($"Tên đăng nhập '{userName}' đã tồn tại."));
                if (await _userManager.FindByEmailAsync(email) != null)
                    return Conflict(new Response<object>($"Email '{email}' đã được đăng ký."));

                var nameParts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                var lastName = nameParts.Length > 1 ? nameParts[^1] : fullName;
                var firstName = nameParts.Length > 1 ? string.Join(' ', nameParts[..^1]) : "Người dùng";
                var roleName = ((VaiTroNguoiDung)request.VaiTro).ToString();
                var role = await _roleManager.FindByNameAsync(roleName);
                if (role == null)
                    return BadRequest(new Response<object>($"Vai trò Identity '{roleName}' chưa được khởi tạo."));

                var user = new ApplicationUser
                {
                    Email = email,
                    UserName = userName,
                    FirstName = firstName,
                    LastName = lastName,
                    PhoneNumber = phoneNumber,
                    EmailConfirmed = true,
                    vaiTro = request.VaiTro
                };

                var identityResult = await _userManager.CreateAsync(user, AdminTestPassword);
                if (!identityResult.Succeeded)
                    return BadRequest(new Response<object>(string.Join("; ", identityResult.Errors.Select(x => x.Description))));

                try
                {
                    var roleResult = await _userManager.AddToRoleAsync(user, roleName);
                    if (!roleResult.Succeeded)
                        throw new InvalidOperationException(string.Join("; ", roleResult.Errors.Select(x => x.Description)));

                    var profile = new Domain.Entities.NguoiDung
                    {
                        ApplicationUserId = user.Id,
                        VaiTro = (VaiTroNguoiDung)request.VaiTro,
                        IsActive = request.IsActive
                    };
                    await _applicationContext.NguoiDungs.AddAsync(profile);
                    await _applicationContext.SaveChangesAsync();

                    return Ok(new Response<object>(new
                    {
                        ApplicationUserId = user.Id,
                        NguoiDungId = profile.Id,
                        UserName = user.UserName,
                        DefaultPassword = AdminTestPassword
                    }, "Đã tạo tài khoản và hồ sơ người dùng."));
                }
                catch (Exception ex)
                {
                    await _userManager.DeleteAsync(user);
                    return BadRequest(new Response<object>($"Không thể tạo hồ sơ người dùng: {ex.Message}"));
                }
            });
        }

        // PUT: api/nguoidung/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateNguoiDungCommand command)
        {
            return await EnforcePermissionAndExecute("nguoidungs", "edit", async () =>
            {
                if (id != command.Id)
                {
                    return BadRequest();
                }
                return Ok(await Mediator.Send(command));
            });
        }

        // DELETE: api/nguoidung/5
        // Xóa cả tài khoản đăng nhập (Identity) để tránh orphan account,
        // sau đó xóa hồ sơ NguoiDung.
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute("nguoidungs", "delete", async () =>
            {
                var detail = await Mediator.Send(new GetNguoiDungByIdQuery() { Id = id });
                if (detail?.Succeeded == true && !string.IsNullOrWhiteSpace(detail.Data?.ApplicationUserId))
                {
                    try
                    {
                        await Mediator.Send(new DeleteUserByIdCommand { Id = detail.Data.ApplicationUserId });
                    }
                    catch
                    {
                        // Tài khoản login đã không còn thì vẫn tiếp tục xóa hồ sơ.
                    }
                }
                return Ok(await Mediator.Send(new DeleteNguoiDungCommand { Id = id }));
            });
        }
    }

    public sealed class AdminCreateNguoiDungRequest
    {
        public string HoTen { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public int VaiTro { get; set; } = (int)VaiTroNguoiDung.UNG_VIEN;
        public bool IsActive { get; set; } = true;
    }
}
