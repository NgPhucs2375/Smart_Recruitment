using Application.Features.TinTuyenDung.Commands.CreateTinTuyenDung;
using Application.Features.TinTuyenDung.Commands.DeleteTinTuyenDung;
using Application.Features.TinTuyenDung.Commands.FireTinTuyenDungTrigger;
using Application.Features.TinTuyenDung.Commands.UpdateTinTuyenDung;
using Application.Features.TinTuyenDung.Queries.GetAllTinTuyenDungs;
using Application.Features.TinTuyenDung.Queries.GetTinTuyenDungById;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
            return await EnforcePermissionAndExecute("tinvuyendungs", "list", async () =>
            {
                return Ok(await Mediator.Send(new GetAllTinTuyenDungsQuery
                {
                    _end = filter._end,
                    _start = filter._start,
                    _order = filter._order,
                    _sort = filter._sort,
                    _filter = filter._filter
                }));
            });
        }

        [HttpGet("show/{id}")]
        public async Task<IActionResult> Show(int id)
        {
            return await EnforcePermissionAndExecute("tinvuyendungs", "show", async () =>
            {
                return Ok(await Mediator.Send(new GetTinTuyenDungByIdQuery { Id = id }));
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateTinTuyenDungCommand command)
        {
            return await EnforcePermissionAndExecute("tinvuyendungs", "create", async () =>
            {
                return Ok(await Mediator.Send(command));
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateTinTuyenDungCommand command)
        {
            return await EnforcePermissionAndExecute("tinvuyendungs", "edit", async () =>
            {
                if (id != command.Id) return BadRequest();
                return Ok(await Mediator.Send(command));
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute("tinvuyendungs", "delete", async () =>
            {
                return Ok(await Mediator.Send(new DeleteTinTuyenDungCommand { Id = id }));
            });
        }

        [HttpPost("{id}/fire")]
        public async Task<IActionResult> Fire(int id, FireTinTuyenDungTriggerCommand command)
        {
            return await EnforcePermissionAndExecute("tinvuyendungs", "edit", async () =>
            {
                if (id != command.Id) return BadRequest();
                return Ok(await Mediator.Send(command));
            });
        }
    }
}
