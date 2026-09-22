using Infrastructure.Identity.Features.Role.Commands.CreateRole;
using Infrastructure.Identity.Features.Role.Commands.DeleteRoleById;
using Infrastructure.Identity.Features.Role.Commands.UpdateRole;
using Infrastructure.Identity.Features.Role.Queries.GetPagingRole;
using Infrastructure.Identity.Features.Role.Queries.GetRoleById;
using Microsoft.AspNetCore.Mvc;
using Casbin;
using Infrastructure.Identity.Features.Role.Commands.AssignRole;
using Infrastructure.Identity.Features.Role.Commands.RemoveRole;
using Microsoft.AspNetCore.Authorization;

namespace WebApp.Server.Controllers.Identity
{
    [Route("api/roles")]
    [ApiController]
    [Authorize]
    public class RolesController : BaseApiController
    {
     
        public RolesController(Microsoft.AspNetCore.Hosting.IWebHostEnvironment webEnvironment,Enforcer enforcer) : base(webEnvironment,enforcer)
        {
        }
        //GET: api/roles?_start=0&_end=10&_order=asc&_sort=Id
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] GetPagingRoleParameter fitler)
        {
            return await EnforcePermissionAndExecute("roles", "list", async () =>
            {
                return Ok(await Mediator.Send(new GetPagingRoleQuery()
                {
                    id = fitler.id,
                    _end = fitler._end,
                    _start = fitler._start,
                    _order = fitler._order,
                    _sort = fitler._sort,
                    _filter = fitler._filter
                }));
            });
        }

        // GET: api/roles/show/5
        [HttpGet("show/{id}")]
        public async Task<IActionResult> Show(string id)
        {
            return await EnforcePermissionAndExecute("roles", "show", async () =>
            {
                return Ok(await Mediator.Send(new GetRoleByIdQuery() { Id = id }));
            });
        }

        // POST: api/roles
        [HttpPost]
        public async Task<IActionResult> Create(CreateRoleCommand command)
        {
            return await EnforcePermissionAndExecute("roles", "create", async () =>
            {
                return Ok(await Mediator.Send(command));
            });
        }

        // PUT: api/roles/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, UpdateRoleCommand command)
        {
            return await EnforcePermissionAndExecute("roles", "edit", async () =>
            {
                if (id != command.Id)
                {
                    return BadRequest();
                }
                return Ok(await Mediator.Send(command));
            });
        }

        // DELETE: api/roles/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            return await EnforcePermissionAndExecute("roles", "delete", async () =>
            {
                return Ok(await Mediator.Send(new DeleteRoleByIdCommand { Id = id }));
            });
        }

        // POST: api/roles/assign
        [HttpPost("assign")]
        public async Task<IActionResult> AssignRoleToUser([FromBody] AssignRoleCommand command)
        {
            return await EnforcePermissionAndExecute("roles", "assign", async () =>
            {
                return Ok(await Mediator.Send(command));
            });
        }

        // POST: api/roles/remove
        [HttpPost("remove")]
        public async Task<IActionResult> RemoveRoleFromUser([FromBody] RemoveRoleCommand command)
        {
            return await EnforcePermissionAndExecute("roles", "remove", async () =>
            {
                return Ok(await Mediator.Send(command));
            });
        }
    }
}
