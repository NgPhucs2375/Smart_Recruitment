using Application.DTOs.KyNangTinTuyenDung;
using Application.Features.KyNangTinTuyenDung.Queries.GetAllKyNangTinTuyenDungs;
using Application.Features.KyNangTinTuyenDung.Queries.GetKyNangTinTuyenDungById;
using Application.Features.KyNangTinTuyenDung.Commands.CreateKyNangTinTuyenDung;
using Application.Features.KyNangTinTuyenDung.Commands.UpdateKyNangTinTuyenDung;
using Application.Features.KyNangTinTuyenDung.Commands.DeleteKyNangTinTuyenDung;
using AutoMapper;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Application.DTOs.DanhMucNghe;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/kynangtintuyendungs")]
    public class KyNangTinTuyenDungController : BaseApiController
    {
        private readonly IMapper _mapper;

        public KyNangTinTuyenDungController(
            IWebHostEnvironment hostingEnvironment,
            Enforcer enforcer,
            IMapper mapper)
            : base(hostingEnvironment, enforcer)
        {
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] GetAllKyNangTinTuyenDungsParameter filter)
        {
            return await EnforcePermissionAndExecute(
                "kynangtintuyendungs",
                "list",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetAllKyNangTinTuyenDungsQuery
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
                "kynangtintuyendungs",
                "show",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetKyNangTinTuyenDungByIdQuery
                        {
                            Id = id
                        }));
                });
        }

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] TaoKyNangTinTuyenDungDto dto)
        {
            return await EnforcePermissionAndExecute(
                "kynangtintuyendungs",
                "create",
                async () =>
                {
                    var command =
                        _mapper.Map<CreateKyNangTinTuyenDungCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] CapNhatKyNangTinTuyenDungDto dto)
        {
            return await EnforcePermissionAndExecute(
                "kynangtintuyendungs",
                "edit",
                async () =>
                {
                    if (id != dto.Id)
                    {
                        return BadRequest();
                    }

                    var command =
                        _mapper.Map<UpdateKyNangTinTuyenDungCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute(
                "kynangtintuyendungs",
                "delete",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new DeleteKyNangTinTuyenDungByIdCommand
                        {
                            Id = id
                        }));
                });
        }
    }
}