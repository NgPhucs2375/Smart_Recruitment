using Application.Features.DonUngTuyen.Commands.UpdateDonUngTuyen;
using Application.Features.DonUngTuyen.Queries.GetAllDonUngTuyens;
using Application.Features.DonUngTuyen.Queries.GetDonUngTuyenById;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/donungtuyens")]
    public class DonUngTuyenController : BaseApiController
    {
        public DonUngTuyenController(
            Microsoft.AspNetCore.Hosting.IWebHostEnvironment hostingEnvironment, Enforcer enforcer) : base(hostingEnvironment, enforcer)
        {
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] GetAllDonUngTuyensParameter filter)
        {
            return await EnforcePermissionAndExecute("donungtuyens", "list", async () =>
            {
                return Ok(await Mediator.Send(new GetAllDonUngTuyensQuery
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
            return await EnforcePermissionAndExecute("donungtuyens", "show", async () =>
            {
                return Ok(await Mediator.Send(new GetDonUngTuyenByIdQuery { Id = id }));
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateDonUngTuyenCommand command)
        {
            return await EnforcePermissionAndExecute("donungtuyens", "edit", async () =>
            {
                if (id != command.Id) return BadRequest();
                return Ok(await Mediator.Send(command));
            });
        }
    }
}
