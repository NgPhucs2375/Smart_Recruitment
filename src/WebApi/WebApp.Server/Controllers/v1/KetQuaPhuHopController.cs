using Application.DTOs.KetQuaPhuHop;
using Application.Features.KetQuaPhuHop.Queries.GetAllKetQuaPhuHops;
using Application.Features.KetQuaPhuHop.Queries.GetKetQuaPhuHopById;
using Application.Features.KetQuaPhuHop.Commands.CreateKetQuaPhuHop;
using Application.Features.KetQuaPhuHop.Commands.UpdateKetQuaPhuHop;
using Application.Features.KetQuaPhuHop.Commands.DeleteKetQuaPhuHop;
using Application.Features.KetQuaPhuHop.Commands.TinhDiemPhuHop;
using AutoMapper;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Application.DTOs.DanhMucNghe;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/ketquaphuhops")]
    public class KetQuaPhuHopController : BaseApiController
    {
        private readonly IMapper _mapper;

        public KetQuaPhuHopController(
            IWebHostEnvironment hostingEnvironment,
            Enforcer enforcer,
            IMapper mapper)
            : base(hostingEnvironment, enforcer)
        {
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] GetAllKetQuaPhuHopsParameter filter)
        {
            return await EnforcePermissionAndExecute(
                "ketquaphuhops",
                "list",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetAllKetQuaPhuHopsQuery
                        {
                            _start = filter._start,
                            _end = filter._end,
                            _order = filter._order,
                            _sort = filter._sort,
                            _filter = filter._filter
                        }));
                });
        }

        [HttpGet("show/{id}")]
        public async Task<IActionResult> Show(int id)
        {
            return await EnforcePermissionAndExecute(
                "ketquaphuhops",
                "show",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetKetQuaPhuHopByIdQuery
                        {
                            Id = id
                        }));
                });
        }

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] TaoKetQuaPhuHopDto dto)
        {
            return await EnforcePermissionAndExecute(
                "ketquaphuhops",
                "create",
                async () =>
                {
                    var command =
                        _mapper.Map<CreateKetQuaPhuHopCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        [HttpPost("tinh-diem")]
        public async Task<IActionResult> TinhDiem(
            [FromBody] TinhDiemPhuHopDto dto)
        {
            return await EnforcePermissionAndExecute(
                "ketquaphuhops",
                "create",
                async () =>
                {
                    var command =
                        _mapper.Map<TinhDiemPhuHopCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] CapNhatKetQuaPhuHopDto dto)
        {
            return await EnforcePermissionAndExecute(
                "ketquaphuhops",
                "edit",
                async () =>
                {
                    if (id != dto.Id)
                    {
                        return BadRequest();
                    }

                    var command =
                        _mapper.Map<UpdateKetQuaPhuHopCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute(
                "ketquaphuhops",
                "delete",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new DeleteKetQuaPhuHopByIdCommand
                        {
                            Id = id
                        }));
                });
        }
    }
}