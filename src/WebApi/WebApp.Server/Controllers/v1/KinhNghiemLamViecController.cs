using Application.Features.KinhNghiemLamViec.Queries.GetAllKinhNghiemLamViecs;
using Application.Features.KinhNghiemLamViec.Queries.GetKinhNghiemLamViecById;
using Application.Features.KinhNghiemLamViec.Commads.CreateKinhNghiemLamViec;
using Application.Features.KinhNghiemLamViec.Commads.UpdateKinhNghiemLamViec;
using Application.Features.KinhNghiemLamViec.Commads.DeleteKinhNghiemLamViec;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/kinhnghiemlamviec")]
    public class KinhNghiemLamViecController : BaseApiController
    {
        public KinhNghiemLamViecController(IWebHostEnvironment hostingEnvironment, Enforcer enforcer)
            : base(hostingEnvironment, enforcer)
        {
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] GetAllKinhNghiemLamViecsParameter filter)
        {
            return await EnforcePermissionAndExecute("kinhnghiemlamviecs", "list", async () =>
            {
                return Ok(await Mediator.Send(new GetAllKinhNghiemLamViecsQuery
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
            return await EnforcePermissionAndExecute("kinhnghiemlamviecs", "show", async () =>
            {
                return Ok(await Mediator.Send(new GetKinhNghiemLamViecByIdQuery { Id = id }));
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateKinhNghiemLamViecCommand command)
        {
            return await EnforcePermissionAndExecute("kinhnghiemlamviecs", "create", async () =>
            {
                return Ok(await Mediator.Send(command));
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateKinhNghiemLamViecCommand command)
        {
            return await EnforcePermissionAndExecute("kinhnghiemlamviecs", "edit", async () =>
            {
                if (id != command.Id)
                    return BadRequest();

                return Ok(await Mediator.Send(command));
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute("kinhnghiemlamviecs", "delete", async () =>
            {
                return Ok(await Mediator.Send(new DeleteKinhNghiemLamViecByIdCommand { Id = id }));
            });
        }
    }
}
