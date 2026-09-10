using Application.DTOs.KyNang;
using Application.Features.KyNang.Queries.GetAllKyNangs;
using Application.Features.KyNang.Queries.GetKyNangById;
using Application.Features.KyNang.Commands.CreateKyNang;
using Application.Features.KyNang.Commands.UpdateKyNang;
using Application.Features.KyNang.Commands.DeleteKyNang;
using AutoMapper;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Application.DTOs.DanhMucNghe;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/kynangs")]
    public class KyNangController : BaseApiController
    {
        private readonly IMapper _mapper;

        public KyNangController(
            IWebHostEnvironment hostingEnvironment,
            Enforcer enforcer,
            IMapper mapper)
            : base(hostingEnvironment, enforcer)
        {
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] GetAllKyNangsParameter filter)
        {
            return await EnforcePermissionAndExecute(
                "kynangs",
                "list",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetAllKyNangsQuery
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
                "kynangs",
                "show",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetKyNangByIdQuery
                        {
                            Id = id
                        }));
                });
        }

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] TaoKyNangDto dto)
        {
            return await EnforcePermissionAndExecute(
                "kynangs",
                "create",
                async () =>
                {
                    var command =
                        _mapper.Map<CreateKyNangCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] CapNhatKyNangDto dto)
        {
            return await EnforcePermissionAndExecute(
                "kynangs",
                "edit",
                async () =>
                {
                    if (id != dto.Id)
                    {
                        return BadRequest();
                    }

                    var command =
                        _mapper.Map<UpdateKyNangCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute(
                "kynangs",
                "delete",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new DeleteKyNangByIdCommand
                        {
                            Id = id
                        }));
                });
        }
    }
}