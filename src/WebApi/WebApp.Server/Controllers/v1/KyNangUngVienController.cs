using Application.Features.KyNangUngVien.Queries.GetAllKyNangUngViens;
using Application.Features.KyNangUngVien.Queries.GetKyNangUngVienById;
using Application.Features.KyNangUngVien.Commads.CreateKyNangUngVien;
using Application.Features.KyNangUngVien.Commads.UpdateKyNangUngVien;
using Application.Features.KyNangUngVien.Commads.DeleteKyNangUngVien;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/kynangungvien")]
    public class KyNangUngVienController : BaseApiController
    {
        public KyNangUngVienController(IWebHostEnvironment hostingEnvironment, Enforcer enforcer)
            : base(hostingEnvironment, enforcer)
        {
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] GetAllKyNangUngViensParameter filter)
        {
            return await EnforcePermissionAndExecute("kynangungviens", "list", async () =>
            {
                return Ok(await Mediator.Send(new GetAllKyNangUngViensQuery
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
            return await EnforcePermissionAndExecute("kynangungviens", "show", async () =>
            {
                return Ok(await Mediator.Send(new GetKyNangUngVienByIdQuery { Id = id }));
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateKyNangUngVienCommand command)
        {
            return await EnforcePermissionAndExecute("kynangungviens", "create", async () =>
            {
                return Ok(await Mediator.Send(command));
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateKyNangUngVienCommand command)
        {
            return await EnforcePermissionAndExecute("kynangungviens", "edit", async () =>
            {
                if (id != command.Id)
                    return BadRequest();

                return Ok(await Mediator.Send(command));
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute("kynangungviens", "delete", async () =>
            {
                return Ok(await Mediator.Send(new DeleteKyNangUngVienByIdCommand { Id = id }));
            });
        }
    }
}
