using Application.Features.DanhGia.Commands.CreateDanhGia;
using Application.Features.DanhGia.Commands.DeleteDanhGia;
using Application.Features.DanhGia.Commands.UpdateDanhGia;
using Application.Features.DanhGia.Queries.GetAllDanhGias;
using Application.Features.DanhGia.Queries.GetDanhGiaById;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1;

[Authorize]
[Route("api/danhgia")]
public class DanhGiaController(Microsoft.AspNetCore.Hosting.IWebHostEnvironment environment, Enforcer enforcer) : BaseApiController(environment, enforcer)
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] GetAllDanhGiasParameter filter) => await EnforcePermissionAndExecute("danhgias", "list", async () => Ok(await Mediator.Send(new GetAllDanhGiasQuery { _start = filter?._start ?? 0, _end = filter?._end ?? 0, DonUngTuyenId = filter?.DonUngTuyenId, _filter = filter?._filter, _sort = filter?._sort, _order = filter?._order })));
    [HttpGet("show/{id:int}")]
    public async Task<IActionResult> Show(int id) => await EnforcePermissionAndExecute("danhgias", "show", async () => Ok(await Mediator.Send(new GetDanhGiaByIdQuery { Id = id })));
    [HttpPost]
    public async Task<IActionResult> Create(CreateDanhGiaCommand command) => await EnforcePermissionAndExecute("danhgias", "create", async () => Ok(await Mediator.Send(command)));
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateDanhGiaCommand command) { if (id != command.Id) return BadRequest(); return await EnforcePermissionAndExecute("danhgias", "edit", async () => Ok(await Mediator.Send(command))); }
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => await EnforcePermissionAndExecute("danhgias", "delete", async () => Ok(await Mediator.Send(new DeleteDanhGiaByIdCommand { Id = id })));
}
