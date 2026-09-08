using Application.Features.DoanhNghiep.Commands.CreateDoanhNghiep;
using Application.Features.DoanhNghiep.Commands.DeleteDoanhNghiep;
using Application.Features.DoanhNghiep.Commands.UpdateDoanhNghiep;
using Application.Features.DoanhNghiep.Queries.GetAllDoanhNghieps;
using Application.Features.DoanhNghiep.Queries.GetDoanhNghiepById;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1;

[Authorize]
[Route("api/doanhnghiep")]
public class DoanhNghiepController(Microsoft.AspNetCore.Hosting.IWebHostEnvironment environment, Enforcer enforcer) : BaseApiController(environment, enforcer)
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] GetAllDoanhNghiepsParameter filter) => await EnforcePermissionAndExecute("doanhnghieps", "list", async () => Ok(await Mediator.Send(new GetAllDoanhNghiepsQuery { _start = filter?._start ?? 0, _end = filter?._end ?? 0, _filter = filter?._filter, _sort = filter?._sort, _order = filter?._order })));
    [HttpGet("show/{id:int}")]
    public async Task<IActionResult> Show(int id) => await EnforcePermissionAndExecute("doanhnghieps", "show", async () => Ok(await Mediator.Send(new GetDoanhNghiepByIdQuery { Id = id })));
    [HttpPost]
    public async Task<IActionResult> Create(CreateDoanhNghiepCommand command) => await EnforcePermissionAndExecute("doanhnghieps", "create", async () => Ok(await Mediator.Send(command)));
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateDoanhNghiepCommand command) { if (id != command.Id) return BadRequest(); return await EnforcePermissionAndExecute("doanhnghieps", "edit", async () => Ok(await Mediator.Send(command))); }
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => await EnforcePermissionAndExecute("doanhnghieps", "delete", async () => Ok(await Mediator.Send(new DeleteDoanhNghiepByIdCommand { Id = id })));
}
