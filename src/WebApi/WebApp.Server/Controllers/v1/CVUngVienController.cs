using Application.Features.CVUngVien.Commands.CreateCVUngVien;
using Application.Features.CVUngVien.Commands.DeleteCVUngVien;
using Application.Features.CVUngVien.Commands.UpdateCVUngVien;
using Application.Features.CVUngVien.Queries.GetAllCVUngViens;
using Application.Features.CVUngVien.Queries.GetCVUngVienById;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1;

[Authorize]
[Route("api/cvungvien")]
public class CVUngVienController(Microsoft.AspNetCore.Hosting.IWebHostEnvironment environment, Enforcer enforcer) : BaseApiController(environment, enforcer)
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] GetAllCVUngViensParameter filter) => await EnforcePermissionAndExecute("cvungviens", "list", async () => Ok(await Mediator.Send(new GetAllCVUngViensQuery { _start = filter?._start ?? 0, _end = filter?._end ?? 0, HoSoUngVienId = filter?.HoSoUngVienId, _filter = filter?._filter, _sort = filter?._sort, _order = filter?._order })));
    [HttpGet("show/{id:int}")]
    public async Task<IActionResult> Show(int id) => await EnforcePermissionAndExecute("cvungviens", "show", async () => Ok(await Mediator.Send(new GetCVUngVienByIdQuery { Id = id })));
    [HttpPost]
    public async Task<IActionResult> Create(CreateCVUngVienCommand command) => await EnforcePermissionAndExecute("cvungviens", "create", async () => Ok(await Mediator.Send(command)));
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateCVUngVienCommand command) { if (id != command.Id) return BadRequest(); return await EnforcePermissionAndExecute("cvungviens", "edit", async () => Ok(await Mediator.Send(command))); }
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => await EnforcePermissionAndExecute("cvungviens", "delete", async () => Ok(await Mediator.Send(new DeleteCVUngVienByIdCommand { Id = id })));
}
