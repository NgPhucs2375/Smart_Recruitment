using Application.Features.KetQuaPhuHop.Queries.GetAllKetQuaPhuHops;
using Application.Features.KetQuaPhuHop.Queries.GetKetQuaPhuHopById;
using Application.Features.KetQuaPhuHop.Commads.CreateKetQuaPhuHop;
using Application.Features.KetQuaPhuHop.Commads.UpdateKetQuaPhuHop;
using Application.Features.KetQuaPhuHop.Commads.DeleteKetQuaPhuHop;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/ketquaphuhop")]
    public class KetQuaPhuHopController : BaseApiController
    {
        public KetQuaPhuHopController(IWebHostEnvironment hostingEnvironment, Enforcer enforcer)
            : base(hostingEnvironment, enforcer)
        {
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] GetAllKetQuaPhuHopsParameter filter)
        {
            return await EnforcePermissionAndExecute("ketquaphuhops", "list", async () =>
            {
                return Ok(await Mediator.Send(new GetAllKetQuaPhuHopsQuery
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
            return await EnforcePermissionAndExecute("ketquaphuhops", "show", async () =>
            {
                return Ok(await Mediator.Send(new GetKetQuaPhuHopByIdQuery { Id = id }));
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateKetQuaPhuHopCommand command)
        {
            return await EnforcePermissionAndExecute("ketquaphuhops", "create", async () =>
            {
                return Ok(await Mediator.Send(command));
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateKetQuaPhuHopCommand command)
        {
            return await EnforcePermissionAndExecute("ketquaphuhops", "edit", async () =>
            {
                if (id != command.Id)
                    return BadRequest();

                return Ok(await Mediator.Send(command));
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute("ketquaphuhops", "delete", async () =>
            {
                return Ok(await Mediator.Send(new DeleteKetQuaPhuHopByIdCommand { Id = id }));
            });
        }
    }
}
