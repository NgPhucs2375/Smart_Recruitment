using Application.Features.LichPhongVan.Queries.GetAllLichPhongVans;
using Application.Features.LichPhongVan.Queries.GetLichPhongVanById;
using Application.Features.LichPhongVan.Commands.CreateLichPhongVan;
using Application.Features.LichPhongVan.Commands.UpdateLichPhongVan;
using Application.Features.LichPhongVan.Commands.DeleteLichPhongVan;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/lichphongvan")]
    public class LichPhongVanController : BaseApiController
    {
        public LichPhongVanController(
            Microsoft.AspNetCore.Hosting.IWebHostEnvironment hostingEnvironment, Enforcer enforcer) : base(hostingEnvironment, enforcer)
        {
        }

        // GET: api/lichphongvan
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] GetAllLichPhongVansParameter filter)
        {
            return await EnforcePermissionAndExecute("lichphongvans", "list", async () =>
            {
                return Ok(await Mediator.Send(new GetAllLichPhongVansQuery()
                {
                    _end = filter._end,
                    _start = filter._start,
                    _order = filter._order,
                    _sort = filter._sort,
                    _filter = filter._filter
                }));
            });
        }

        // GET: api/lichphongvan/show/5
        [HttpGet("show/{id}")]
        public async Task<IActionResult> Show(int id)
        {
            return await EnforcePermissionAndExecute("lichphongvans", "show", async () =>
            {
                return Ok(await Mediator.Send(new GetLichPhongVanByIdQuery() { Id = id }));
            });
        }

        // POST: api/lichphongvan
        [HttpPost]
        public async Task<IActionResult> Create(CreateLichPhongVanCommand command)
        {
            return await EnforcePermissionAndExecute("lichphongvans", "create", async () =>
            {
                return Ok(await Mediator.Send(command));
            });
        }

        // PUT: api/lichphongvan/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateLichPhongVanCommand command)
        {
            return await EnforcePermissionAndExecute("lichphongvans", "edit", async () =>
            {
                if (id != command.Id)
                {
                    return BadRequest();
                }
                return Ok(await Mediator.Send(command));
            });
        }

        // DELETE: api/lichphongvan/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute("lichphongvans", "delete", async () =>
            {
                return Ok(await Mediator.Send(new DeleteLichPhongVanCommand { Id = id }));
            });
        }
    }
}
