using Application.DTOs.DanhGia;
using Application.DTOs.DanhMucNghe;
using Application.Features.DanhGia.Commands.CreateDanhGia;
using Application.Features.DanhGia.Commands.DeleteDanhGia;
using Application.Features.DanhGia.Commands.UpdateDanhGia;
using Application.Features.DanhGia.Queries.GetAllDanhGias;
using Application.Features.DanhGia.Queries.GetDanhGiaById;
using AutoMapper;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/danhgias")]
    public class DanhGiaController : BaseApiController
    {
        private readonly IMapper _mapper;

        public DanhGiaController(
            Microsoft.AspNetCore.Hosting.IWebHostEnvironment hostingEnvironment,
            Enforcer enforcer,
            IMapper mapper)
            : base(hostingEnvironment, enforcer)
        {
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] GetAllDanhGiasParameter filter)
        {
            return await EnforcePermissionAndExecute("danhgias", "list", async () =>
            {
                return Ok(await Mediator.Send(new GetAllDanhGiasQuery
                {
                    _start = filter._start,
                    _end = filter._end,
                    DonUngTuyenId = filter.DonUngTuyenId,
                    _filter = filter._filter,
                    _sort = filter._sort,
                    _order = filter._order
                }));
            });
        }

        [HttpGet("show/{id}")]
        public async Task<IActionResult> Show(int id)
        {
            return await EnforcePermissionAndExecute("danhgias", "show", async () =>
            {
                return Ok(await Mediator.Send(new GetDanhGiaByIdQuery
                {
                    Id = id
                }));
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TaoDanhGiaDto dto)
        {
            return await EnforcePermissionAndExecute("danhgias", "create", async () =>
            {
                var command = _mapper.Map<CreateDanhGiaCommand>(dto);

                return Ok(await Mediator.Send(command));
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] CapNhatDanhGiaDto dto)
        {
            return await EnforcePermissionAndExecute("danhgias", "edit", async () =>
            {
                if (id != dto.Id)
                {
                    return BadRequest();
                }

                var command = _mapper.Map<UpdateDanhGiaCommand>(dto);

                return Ok(await Mediator.Send(command));
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute("danhgias", "delete", async () =>
            {
                return Ok(await Mediator.Send(
                    new DeleteDanhGiaByIdCommand
                    {
                        Id = id
                    }));
            });
        }
    }
}