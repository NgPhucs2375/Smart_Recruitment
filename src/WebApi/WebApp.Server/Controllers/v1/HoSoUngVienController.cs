using Application.DTOs.HoSoUngVien;
using Application.Features.HoSoUngVien.Queries.GetAllHoSoUngViens;
using Application.Features.HoSoUngVien.Queries.GetHoSoUngVienById;
using Application.Features.HoSoUngVien.Queries.GetMyHoSoUngVien;
using Application.Features.HoSoUngVien.Commands.CreateHoSoUngVien;
using Application.Features.HoSoUngVien.Commands.UpdateHoSoUngVien;
using Application.Features.HoSoUngVien.Commands.DeleteHoSoUngVien;
using AutoMapper;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
     [Authorize]
     [Route("api/hosoungviens")]
     public class HoSoUngVienController : BaseApiController
     {
         private readonly IMapper _mapper;
         public HoSoUngVienController(
             Microsoft.AspNetCore.Hosting.IWebHostEnvironment hostingEnvironment, Enforcer enforcer, IMapper mapper) : base(hostingEnvironment,enforcer)
         {
             _mapper = mapper;
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
          // GET: api/hosoungviens/cua-toi
        [HttpGet("cua-toi")]
        public async Task<IActionResult> CuaToi()
        {
            return await EnforcePermissionAndExecute("hosoungviens", "show", async () =>
            {
                return Ok(await Mediator.Send(new GetMyHoSoUngVienQuery()));
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
        public async Task<IActionResult> Create([FromBody] TaoHoSoUngVienDto dto)
        {
            return await EnforcePermissionAndExecute("hosoungviens", "create", async () =>
            {
                var command = _mapper.Map<CreateHoSoUngVienCommand>(dto);
                return Ok(await Mediator.Send(command));
            });
        }

        // PUT: api/hosoungviens/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CapNhatHoSoUngVienDto dto)
        {
            return await EnforcePermissionAndExecute("hosoungviens", "edit", async () =>
            {
                if (id != dto.Id)
                {
                    return BadRequest();
                }
                var command = _mapper.Map<UpdateHoSoUngVienCommand>(dto);
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