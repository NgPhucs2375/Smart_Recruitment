using Application.Features.KetQuaPhanTichCv.Commands.CreateKetQuaPhanTichCv;
using Application.Features.KetQuaPhanTichCv.Commands.DeleteKetQuaPhanTichCv;
using Application.Features.KetQuaPhanTichCv.Commands.UpdateKetQuaPhanTichCv;
using Application.Features.KetQuaPhanTichCv.Queries.GetAllKetQuaPhanTichCvs;
using Application.Features.KetQuaPhanTichCv.Queries.GetKetQuaPhanTichCvById;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1;

[Authorize]
[Route("api/ketquaphantichcv")]
public class KetQuaPhanTichCvController(Microsoft.AspNetCore.Hosting.IWebHostEnvironment environment, Enforcer enforcer) : BaseApiController(environment, enforcer)
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] GetAllKetQuaPhanTichCvsParameter filter) => await EnforcePermissionAndExecute("ketquaphantichcvs", "list", async () => Ok(await Mediator.Send(new GetAllKetQuaPhanTichCvsQuery { _start = filter?._start ?? 0, _end = filter?._end ?? 0, _filter = filter?._filter, _sort = filter?._sort, _order = filter?._order, CVUngVienId = filter?.CVUngVienId })));
    [HttpGet("show/{id:int}")]
    public async Task<IActionResult> Show(int id) => await EnforcePermissionAndExecute("ketquaphantichcvs", "show", async () => Ok(await Mediator.Send(new GetKetQuaPhanTichCvByIdQuery { Id = id })));
    [HttpPost]
    public async Task<IActionResult> Create(CreateKetQuaPhanTichCvCommand command) => await EnforcePermissionAndExecute("ketquaphantichcvs", "create", async () => Ok(await Mediator.Send(command)));
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateKetQuaPhanTichCvCommand command) { if (id != command.Id) return BadRequest(); return await EnforcePermissionAndExecute("ketquaphantichcvs", "edit", async () => Ok(await Mediator.Send(command))); }
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => await EnforcePermissionAndExecute("ketquaphantichcvs", "delete", async () => Ok(await Mediator.Send(new DeleteKetQuaPhanTichCvByIdCommand { Id = id })));
}
