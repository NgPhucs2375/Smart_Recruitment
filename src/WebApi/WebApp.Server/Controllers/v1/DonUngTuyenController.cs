using Application.Features.DonUngTuyen.Commands.CreateDonUngTuyen;
using Application.Features.DonUngTuyen.Commands.DeleteDonUngTuyen;
using Application.Features.DonUngTuyen.Commands.UpdateDonUngTuyen;
using Application.Features.DonUngTuyen.Queries.GetAllDonUngTuyens;
using Application.Features.DonUngTuyen.Queries.GetDonUngTuyenById;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1;

[Authorize]
[Route("api/donungtuyen")]
public class DonUngTuyenController(Microsoft.AspNetCore.Hosting.IWebHostEnvironment environment, Enforcer enforcer) : BaseApiController(environment, enforcer)
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] GetAllDonUngTuyensParameter filter) => await EnforcePermissionAndExecute("donungtuyens", "list", async () => Ok(await Mediator.Send(new GetAllDonUngTuyensQuery { _start = filter?._start ?? 0, _end = filter?._end ?? 0, _filter = filter?._filter, _sort = filter?._sort, _order = filter?._order, HoSoUngVienId = filter?.HoSoUngVienId, TinTuyenDungId = filter?.TinTuyenDungId })));
    [HttpGet("show/{id:int}")]
    public async Task<IActionResult> Show(int id) => await EnforcePermissionAndExecute("donungtuyens", "show", async () => Ok(await Mediator.Send(new GetDonUngTuyenByIdQuery { Id = id })));
    [HttpPost]
    public async Task<IActionResult> Create(CreateDonUngTuyenCommand command) => await EnforcePermissionAndExecute("donungtuyens", "create", async () => Ok(await Mediator.Send(command)));
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateDonUngTuyenCommand command) { if (id != command.Id) return BadRequest(); return await EnforcePermissionAndExecute("donungtuyens", "edit", async () => Ok(await Mediator.Send(command))); }
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => await EnforcePermissionAndExecute("donungtuyens", "delete", async () => Ok(await Mediator.Send(new DeleteDonUngTuyenByIdCommand { Id = id })));
}
