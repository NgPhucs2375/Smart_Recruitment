using Application.Features.HoSoNhaTuyenDung.Queries.GetAllHoSoNhaTuyenDungs;
using Application.Features.HoSoNhaTuyenDung.Queries.GetHoSoNhaTuyenDungById;
using Application.Features.HoSoNhaTuyenDung.Commands.CreateHoSoNhaTuyenDung;
using Application.Features.HoSoNhaTuyenDung.Commands.UpdateHoSoNhaTuyenDung;
using Application.Features.HoSoNhaTuyenDung.Commands.DeleteHoSoNhaTuyenDung;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/hosonhatuyendung")]
    public class HoSoNhaTuyenDungController : BaseApiController
    {
        public HoSoNhaTuyenDungController(
            Microsoft.AspNetCore.Hosting.IWebHostEnvironment hostingEnvironment, Enforcer enforcer) : base(hostingEnvironment, enforcer)
        {
        }

        // GET: api/hosonhatuyendung
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] GetAllHoSoNhaTuyenDungsParameter filter)
        {
            return await EnforcePermissionAndExecute("hosonhatuyendungs", "list", async () =>
            {
                return Ok(await Mediator.Send(new GetAllHoSoNhaTuyenDungsQuery()
                {
                    _end = filter._end,
                    _start = filter._start,
                    _order = filter._order,
                    _sort = filter._sort,
                    _filter = filter._filter
                }));
            });
        }

        // GET: api/hosonhatuyendung/show/5
        [HttpGet("show/{id}")]
        public async Task<IActionResult> Show(int id)
        {
            return await EnforcePermissionAndExecute("hosonhatuyendungs", "show", async () =>
            {
                return Ok(await Mediator.Send(new GetHoSoNhaTuyenDungByIdQuery() { Id = id }));
            });
        }

        // POST: api/hosonhatuyendung
        [HttpPost]
        public async Task<IActionResult> Create(CreateHoSoNhaTuyenDungCommand command)
        {
            return await EnforcePermissionAndExecute("hosonhatuyendungs", "create", async () =>
            {
                return Ok(await Mediator.Send(command));
            });
        }

        // PUT: api/hosonhatuyendung/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateHoSoNhaTuyenDungCommand command)
        {
            return await EnforcePermissionAndExecute("hosonhatuyendungs", "edit", async () =>
            {
                if (id != command.Id)
                {
                    return BadRequest();
                }
                return Ok(await Mediator.Send(command));
            });
        }

        // DELETE: api/hosonhatuyendung/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute("hosonhatuyendungs", "delete", async () =>
            {
                return Ok(await Mediator.Send(new DeleteHoSoNhaTuyenDungCommand { Id = id }));
            });
        }
    }
}
