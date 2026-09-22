using Application.DTOs.HoSoNhaTuyenDung;
using Application.Features.HoSoNhaTuyenDung.Queries.GetAllHoSoNhaTuyenDungs;
using Application.Features.HoSoNhaTuyenDung.Queries.GetHoSoNhaTuyenDungById;
using Application.Features.HoSoNhaTuyenDung.Commands.CreateHoSoNhaTuyenDung;
using Application.Features.HoSoNhaTuyenDung.Commands.UpdateHoSoNhaTuyenDung;
using Application.Features.HoSoNhaTuyenDung.Commands.DeleteHoSoNhaTuyenDung;
using AutoMapper;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/hosonhatuyendungs")]
    public class HoSoNhaTuyenDungController : BaseApiController
    {
        private readonly IMapper _mapper;

        public HoSoNhaTuyenDungController(
            Microsoft.AspNetCore.Hosting.IWebHostEnvironment hostingEnvironment,
            Enforcer enforcer,
            IMapper mapper)
            : base(hostingEnvironment, enforcer)
        {
            _mapper = mapper;
        }

        // GET: api/hosonhatuyendungs
        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] GetAllHoSoNhaTuyenDungsParameter filter)
        {
            return await EnforcePermissionAndExecute(
                "hosonhatuyendungs",
                "list",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetAllHoSoNhaTuyenDungsQuery
                        {
                            _start = filter._start,
                            _end = filter._end,
                            _order = filter._order,
                            _sort = filter._sort,
                            _filter = filter._filter
                        }));
                });
        }

        // GET: api/hosonhatuyendungs/show/5
        [HttpGet("show/{id}")]
        public async Task<IActionResult> Show(int id)
        {
            return await EnforcePermissionAndExecute(
                "hosonhatuyendungs",
                "show",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetHoSoNhaTuyenDungByIdQuery
                        {
                            Id = id
                        }));
                });
        }

        // POST: api/hosonhatuyendungs
        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] TaoHoSoNhaTuyenDungDto dto)
        {
            return await EnforcePermissionAndExecute(
                "hosonhatuyendungs",
                "create",
                async () =>
                {
                    var command =
                        _mapper.Map<CreateHoSoNhaTuyenDungCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        // PUT: api/hosonhatuyendungs/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] CapNhatHoSoNhaTuyenDungDto dto)
        {
            return await EnforcePermissionAndExecute(
                "hosonhatuyendungs",
                "edit",
                async () =>
                {
                    if (id != dto.Id)
                    {
                        return BadRequest();
                    }

                    var command =
                        _mapper.Map<UpdateHoSoNhaTuyenDungCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        // DELETE: api/hosonhatuyendungs/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute(
                "hosonhatuyendungs",
                "delete",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new DeleteHoSoNhaTuyenDungCommand
                        {
                            Id = id
                        }));
                });
        }
    }
}