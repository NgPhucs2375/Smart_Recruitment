using Application.DTOs.NguoiDung;
using Application.Features.NguoiDung.Queries.GetAllNguoiDungs;
using Application.Features.NguoiDung.Queries.GetNguoiDungById;
using Application.Features.NguoiDung.Commands.CreateNguoiDung;
using Application.Features.NguoiDung.Commands.UpdateNguoiDung;
using Application.Features.NguoiDung.Commands.DeleteNguoiDung;
using Application.Wrappers;
using Casbin;
using Infrastructure.Identity.Contexts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Identity;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/nguoidungs")]
    public class NguoiDungController : BaseApiController
    {
        public NguoiDungController(
            IWebHostEnvironment hostingEnvironment, Enforcer enforcer) : base(hostingEnvironment, enforcer)
        {
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
                    .Select(u => new { u.Id, u.Email, u.UserName, u.LockoutEnd })
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
                            ApplicationUserId = x.ApplicationUserId,
                            VaiTro = x.VaiTro,
                            IsActive = x.IsActive,
                            IsLocked = u?.LockoutEnd.HasValue == true
                                && u.LockoutEnd.Value > DateTimeOffset.UtcNow
                        };
                    })
                    .Where(x => string.IsNullOrWhiteSpace(kw)
                        || (x.Email != null && x.Email.ToLowerInvariant().Contains(kw))
                        || (x.UserName != null && x.UserName.ToLowerInvariant().Contains(kw)))
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
}
