using Application.Features.HoSoUngVien.Queries.GetAllHoSoUngViens;
using Application.Features.HoSoUngVien.Queries.GetHoSoUngVienById;
using Application.Features.HoSoUngVien.Commands.CreateHoSoUngVien;
using Application.Features.HoSoUngVien.Commands.UpdateHoSoUngVien;
using Application.Features.HoSoUngVien.Commands.DeleteHoSoUngVien;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
     [Authorize]
     [Route("api/hosoungviens")]
     public class HoSoUngVienController : BaseApiController
     {

         public HoSoUngVienController(
             Microsoft.AspNetCore.Hosting.IWebHostEnvironment hostingEnvironment, Enforcer enforcer) : base(hostingEnvironment,enforcer)
         {
         }
         // GET: api/<controller>
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] GetAllHoSoUngViensParameter filter)
        {
             return await EnforcePermissionAndExecute("hosoungviens", "list", async () =>
             {
                 return Ok(await Mediator.Send(new GetAllHoSoUngViensQuery()
                 {
                     _end = filter._end,
                    _start = filter._start,
                     _order = filter._order,
                    _sort = filter._sort,
                     _filter = filter._filter                 
                }));
             });
        }
          // GET: api/roles/show/5
        [HttpGet("show/{id}")]
        public async Task<IActionResult> Show(int id)
        {
            return await EnforcePermissionAndExecute("hosoungviens", "show", async () =>
            {
                return Ok(await Mediator.Send(new GetHoSoUngVienByIdQuery() { Id = id }));
            });
        }

        // POST: api/hosoungviens
        [HttpPost]
        public async Task<IActionResult> Create(CreateHoSoUngVienCommand command)
        {
            return await EnforcePermissionAndExecute("hosoungviens", "create", async () =>
            {
                return Ok(await Mediator.Send(command));
            });
        }

        // PUT: api/hosoungviens/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateHoSoUngVienCommand command)
        {
            return await EnforcePermissionAndExecute("hosoungviens", "edit", async () =>
            {
                if (id != command.Id)
                {
                    return BadRequest();
                }
                return Ok(await Mediator.Send(command));
            });
        }

        // DELETE: api/hosoungviens/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute("hosoungviens", "delete", async () =>
            {
                return Ok(await Mediator.Send(new DeleteHoSoUngVienByIdCommand { Id = id }));
            });
        }


    }
}