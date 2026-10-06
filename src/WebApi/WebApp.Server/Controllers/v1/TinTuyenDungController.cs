using Application.Features.TinTuyenDung.Commands.CreateTinTuyenDung;
using Application.Features.TinTuyenDung.Commands.DeleteTinTuyenDung;
using Application.Features.TinTuyenDung.Commands.FireTinTuyenDungTrigger;
using Application.Features.TinTuyenDung.Commands.UpdateTinTuyenDung;
using Application.Features.TinTuyenDung.Queries.GetAllTinTuyenDungs;
using Application.Features.TinTuyenDung.Queries.GetTinTuyenDungById;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Application.Interfaces;
using Application.Wrappers;
using Microsoft.EntityFrameworkCore;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/tintuyendungs")]
    public class TinTuyenDungController : BaseApiController
    {
        public TinTuyenDungController(
            Microsoft.AspNetCore.Hosting.IWebHostEnvironment hostingEnvironment, Enforcer enforcer) : base(hostingEnvironment, enforcer)
        {
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] GetAllTinTuyenDungsParameter filter)
        {
            return await EnforcePermissionAndExecute("tintuyendungs", "list", async () =>
            {
                return Ok(await Mediator.Send(new GetAllTinTuyenDungsQuery
                {
                    _end = filter._end,
                    _start = filter._start,
                    _order = filter._order,
                    _sort = filter._sort,
                    _filter = filter._filter,
                    Location = filter.Location,
                    SalaryMin = filter.SalaryMin,
                    SalaryMax = filter.SalaryMax,
                    Level = filter.Level,
                    EmploymentType = filter.EmploymentType,
                    WorkMode = filter.WorkMode,
                    DoanhNghiepId = filter.DoanhNghiepId,
                    TrangThai = filter.TrangThai,
                    DanhMucNgheId = filter.DanhMucNgheId,
                    KyNangIds = filter.KyNangIds, MatchAllSkills = filter.MatchAllSkills
                }));
            });
        }

        [HttpGet("filter-options")]
        public async Task<IActionResult> FilterOptions()
        {
            return await EnforcePermissionAndExecute("tintuyendungs", "list", async () =>
            {
                var context = HttpContext.RequestServices.GetRequiredService<IApplicationDbContext>();
                var categories = await context.DanhMucNghes.AsNoTracking().OrderBy(x => x.TenNghe)
                    .Select(x => new { x.Id, Name = x.TenNghe }).ToListAsync(HttpContext.RequestAborted);
                var skills = await context.KyNangs.AsNoTracking().OrderBy(x => x.TenKyNang)
                    .Select(x => new { x.Id, Name = x.TenKyNang }).ToListAsync(HttpContext.RequestAborted);
                return Ok(new Response<object>(new { Categories = categories, Skills = skills }));
            });
        }

        [HttpGet("show/{id}")]
        public async Task<IActionResult> Show(int id)
        {
            return await EnforcePermissionAndExecute("tintuyendungs", "show", async () =>
            {
                return Ok(await Mediator.Send(new GetTinTuyenDungByIdQuery { Id = id }));
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateTinTuyenDungCommand command)
        {
            return await EnforcePermissionAndExecute("tintuyendungs", "create", async () =>
            {
                return Ok(await Mediator.Send(command));
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateTinTuyenDungCommand command)
        {
            return await EnforcePermissionAndExecute("tintuyendungs", "edit", async () =>
            {
                if (id != command.Id) return BadRequest();
                return Ok(await Mediator.Send(command));
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id, [FromQuery] System.DateTime? expectedLastModified)
        {
            return await EnforcePermissionAndExecute("tintuyendungs", "delete", async () =>
            {
                return Ok(await Mediator.Send(new DeleteTinTuyenDungCommand { Id = id, ExpectedLastModified = expectedLastModified }));
            });
        }

        [HttpPost("{id}/fire")]
        public async Task<IActionResult> Fire(int id, FireTinTuyenDungTriggerCommand command)
        {
            return await EnforcePermissionAndExecute("tintuyendungs", "edit", async () =>
            {
                if (id != command.Id) return BadRequest();
                return Ok(await Mediator.Send(command));
            });
        }
    }
}
