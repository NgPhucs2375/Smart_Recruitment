using Application.Features.KyNangTinTuyenDung.Queries.GetAllKyNangTinTuyenDungs;
using Application.Features.KyNangTinTuyenDung.Queries.GetKyNangTinTuyenDungById;
using Application.Features.KyNangTinTuyenDung.Commads.CreateKyNangTinTuyenDung;
using Application.Features.KyNangTinTuyenDung.Commads.UpdateKyNangTinTuyenDung;
using Application.Features.KyNangTinTuyenDung.Commads.DeleteKyNangTinTuyenDung;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/kynangtintuyendung")]
    public class KyNangTinTuyenDungController : BaseApiController
    {
        public KyNangTinTuyenDungController(IWebHostEnvironment hostingEnvironment, Enforcer enforcer)
            : base(hostingEnvironment, enforcer)
        {
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] GetAllKyNangTinTuyenDungsParameter filter)
        {
            return await EnforcePermissionAndExecute("kynangtintuyendungs", "list", async () =>
            {
                return Ok(await Mediator.Send(new GetAllKyNangTinTuyenDungsQuery
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
            return await EnforcePermissionAndExecute("kynangtintuyendungs", "show", async () =>
            {
                return Ok(await Mediator.Send(new GetKyNangTinTuyenDungByIdQuery { Id = id }));
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateKyNangTinTuyenDungCommand command)
        {
            return await EnforcePermissionAndExecute("kynangtintuyendungs", "create", async () =>
            {
                return Ok(await Mediator.Send(command));
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateKyNangTinTuyenDungCommand command)
        {
            return await EnforcePermissionAndExecute("kynangtintuyendungs", "edit", async () =>
            {
                if (id != command.Id)
                    return BadRequest();

                return Ok(await Mediator.Send(command));
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute("kynangtintuyendungs", "delete", async () =>
            {
                return Ok(await Mediator.Send(new DeleteKyNangTinTuyenDungByIdCommand { Id = id }));
            });
        }
    }
}
