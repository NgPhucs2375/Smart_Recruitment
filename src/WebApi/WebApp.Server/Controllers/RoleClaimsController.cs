using Infrastructure.Identity;
using Infrastructure.Identity.Features.RoleClaim.Commands.CreateRoleClaim;
using Infrastructure.Identity.Features.RoleClaim.Commands.DeleteRoleClaimById;
using Infrastructure.Identity.Features.RoleClaim.Commands.UpdateRoleClaim;
using Infrastructure.Identity.Features.RoleClaim.Queries.GetPagingRoleClaim;
using Infrastructure.Identity.Features.RoleClaim.Queries.GetRoleClaimById;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;

namespace WebApp.Server.Controllers.Identity;

[Route("api/roleclaims")]
[ApiController]
public class RoleClaimsController : BaseApiController
{
 
    public RoleClaimsController(IWebHostEnvironment webEnvironment) : base(webEnvironment)
    {
    }
    // GET: api/roleclaims?_sort=Id&_order=asc&_start=0&_end=10
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] GetPagingRoleClaimParameter filter)
    {
        return await EnforcePermissionAndExecute("roleclaims", "list", async () =>
            {
                return Ok(await Mediator.Send(new GetPagingRoleClaimQuery()
                {
                    id = filter.id,
                    _end = filter._end,
                    _start = filter._start,
                    _order = filter._order,
                    _sort = filter._sort,
                    _filter = filter._filter
                }));
            });
    }

    // GET: api/roleclaims/5
    [HttpGet("show/{id}")]
    public async Task<IActionResult> Get(int id)
    {
        return await EnforcePermissionAndExecute("roleclaims", "show", async () =>
            {
                return Ok(await Mediator.Send(new GetRoleClaimByIdQuery() { Id = id }));
            });
    }


    // POST: api/roleclaims
    [HttpPost]
    public async Task<IActionResult> Post(CreateRoleClaimCommand command)
    {
        return await EnforcePermissionAndExecute("roleclaims", "create", async () =>
            {
                return Ok(await Mediator.Send(command));
            });
    }

    // PUT: api/roleclaims/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Put(int id, UpdateRoleClaimCommand command)
    {
        return await EnforcePermissionAndExecute("roleclaims", "edit", async () =>
            {
                if (id != command.Id)
                {
                    return BadRequest();
                }
                return Ok(await Mediator.Send(command));
            });
    }

    // DELETE: api/roleclaims/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        return await EnforcePermissionAndExecute("roleclaims", "delete", async () =>
            {
                return Ok(await Mediator.Send(new DeleteRoleClaimByIdCommand { Id = id }));
            });
    }
}
