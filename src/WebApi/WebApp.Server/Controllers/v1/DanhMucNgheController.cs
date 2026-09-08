using Application.Features.DanhMucNghe.Commands.CreateDanhMucNghe;
using Application.Features.DanhMucNghe.Commands.DeleteDanhMucNghe;
using Application.Features.DanhMucNghe.Commands.UpdateDanhMucNghe;
using Application.Features.DanhMucNghe.Queries.GetAllDanhMucNghes;
using Application.Features.DanhMucNghe.Queries.GetDanhMucNgheById;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1;

[Authorize]
[Route("api/danhmucnghe")]
public class DanhMucNgheController(Microsoft.AspNetCore.Hosting.IWebHostEnvironment environment, Enforcer enforcer) : BaseApiController(environment, enforcer)
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] GetAllDanhMucNghesParameter filter) => await EnforcePermissionAndExecute("danhmucnghes", "list", async () => Ok(await Mediator.Send(new GetAllDanhMucNghesQuery { _start = filter?._start ?? 0, _end = filter?._end ?? 0, _filter = filter?._filter, _sort = filter?._sort, _order = filter?._order })));
    [HttpGet("show/{id:int}")]
    public async Task<IActionResult> Show(int id) => await EnforcePermissionAndExecute("danhmucnghes", "show", async () => Ok(await Mediator.Send(new GetDanhMucNgheByIdQuery { Id = id })));
    [HttpPost]
    public async Task<IActionResult> Create(CreateDanhMucNgheCommand command) => await EnforcePermissionAndExecute("danhmucnghes", "create", async () => Ok(await Mediator.Send(command)));
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateDanhMucNgheCommand command) { if (id != command.Id) return BadRequest(); return await EnforcePermissionAndExecute("danhmucnghes", "edit", async () => Ok(await Mediator.Send(command))); }
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => await EnforcePermissionAndExecute("danhmucnghes", "delete", async () => Ok(await Mediator.Send(new DeleteDanhMucNgheByIdCommand { Id = id })));
}
