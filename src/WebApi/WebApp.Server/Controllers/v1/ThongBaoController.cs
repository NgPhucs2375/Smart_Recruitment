using Application.Features.ThongBao.Queries.GetAllThongBaos;
using Application.Features.ThongBao.Queries.GetThongBaoById;
using Application.Features.ThongBao.Commands.CreateThongBao;
using Application.Features.ThongBao.Commands.UpdateThongBao;
using Application.Features.ThongBao.Commands.DeleteThongBao;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/thongbaos")]
    public class ThongBaoController : BaseApiController
    {
        public ThongBaoController(
            Microsoft.AspNetCore.Hosting.IWebHostEnvironment hostingEnvironment, Enforcer enforcer) : base(hostingEnvironment, enforcer)
        {
        }

        // GET: api/thongbao
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] GetAllThongBaosParameter filter)
        {
            return await EnforcePermissionAndExecute("thongbaos", "list", async () =>
            {
                return Ok(await Mediator.Send(new GetAllThongBaosQuery()
                {
                    _end = filter._end,
                    _start = filter._start,
                    _order = filter._order,
                    _sort = filter._sort,
                    _filter = filter._filter
                }));
            });
        }

        // GET: api/thongbao/show/5
        [HttpGet("show/{id}")]
        public async Task<IActionResult> Show(int id)
        {
            return await EnforcePermissionAndExecute("thongbaos", "show", async () =>
            {
                return Ok(await Mediator.Send(new GetThongBaoByIdQuery() { Id = id }));
            });
        }

        // POST: api/thongbao
        [HttpPost]
        public async Task<IActionResult> Create(CreateThongBaoCommand command)
        {
            return await EnforcePermissionAndExecute("thongbaos", "create", async () =>
            {
                return Ok(await Mediator.Send(command));
            });
        }

        // PUT: api/thongbao/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateThongBaoCommand command)
        {
            return await EnforcePermissionAndExecute("thongbaos", "edit", async () =>
            {
                if (id != command.Id)
                {
                    return BadRequest();
                }
                return Ok(await Mediator.Send(command));
            });
        }

        // DELETE: api/thongbao/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute("thongbaos", "delete", async () =>
            {
                return Ok(await Mediator.Send(new DeleteThongBaoCommand { Id = id }));
            });
        }
    }
}
