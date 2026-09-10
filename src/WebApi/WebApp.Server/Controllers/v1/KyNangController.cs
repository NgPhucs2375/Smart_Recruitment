using Application.Features.KyNang.Queries.GetAllKyNangs;
using Application.Features.KyNang.Queries.GetKyNangById;
using Application.Features.KyNang.Commads.CreateKyNang;
using Application.Features.KyNang.Commads.UpdateKyNang;
using Application.Features.KyNang.Commads.DeleteKyNang;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/kynang")]
    public class KyNangController : BaseApiController
    {
        public KyNangController(IWebHostEnvironment hostingEnvironment, Enforcer enforcer)
            : base(hostingEnvironment, enforcer)
        {
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] GetAllKyNangsParameter filter)
        {
            return await EnforcePermissionAndExecute("kynangs", "list", async () =>
            {
                return Ok(await Mediator.Send(new GetAllKyNangsQuery
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
            return await EnforcePermissionAndExecute("kynangs", "show", async () =>
            {
                return Ok(await Mediator.Send(new GetKyNangByIdQuery { Id = id }));
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateKyNangCommand command)
        {
            return await EnforcePermissionAndExecute("kynangs", "create", async () =>
            {
                return Ok(await Mediator.Send(command));
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateKyNangCommand command)
        {
            return await EnforcePermissionAndExecute("kynangs", "edit", async () =>
            {
                if (id != command.Id)
                    return BadRequest();

                return Ok(await Mediator.Send(command));
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute("kynangs", "delete", async () =>
            {
                return Ok(await Mediator.Send(new DeleteKyNangByIdCommand { Id = id }));
            });
        }
    }
}
