using Application.Features.NguoiDung.Queries.GetAllNguoiDungs;
using Application.Features.NguoiDung.Queries.GetNguoiDungById;
using Application.Features.NguoiDung.Commands.CreateNguoiDung;
using Application.Features.NguoiDung.Commands.UpdateNguoiDung;
using Application.Features.NguoiDung.Commands.DeleteNguoiDung;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;

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
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute("nguoidungs", "delete", async () =>
            {
                return Ok(await Mediator.Send(new DeleteNguoiDungCommand { Id = id }));
            });
        }
    }
}
