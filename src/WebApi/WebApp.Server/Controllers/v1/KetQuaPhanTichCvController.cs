using Application.DTOs.DanhMucNghe;
using Application.DTOs.KetQuaPhanTichCv;
using Application.Features.KetQuaPhanTichCv.Commands.CreateKetQuaPhanTichCv;
using Application.Features.KetQuaPhanTichCv.Commands.DeleteKetQuaPhanTichCv;
using Application.Features.KetQuaPhanTichCv.Commands.UpdateKetQuaPhanTichCv;
using Application.Features.KetQuaPhanTichCv.Queries.GetAllKetQuaPhanTichCvs;
using Application.Features.KetQuaPhanTichCv.Queries.GetKetQuaPhanTichCvById;
using AutoMapper;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/ketquaphantichcvs")]
    public class KetQuaPhanTichCvController : BaseApiController
    {
        private readonly IMapper _mapper;

        public KetQuaPhanTichCvController(
            Microsoft.AspNetCore.Hosting.IWebHostEnvironment hostingEnvironment,
            Enforcer enforcer,
            IMapper mapper)
            : base(hostingEnvironment, enforcer)
        {
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] GetAllKetQuaPhanTichCvsParameter filter)
        {
            return await EnforcePermissionAndExecute(
                "ketquaphantichcvs",
                "list",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetAllKetQuaPhanTichCvsQuery
                        {
                            _start = filter._start,
                            _end = filter._end,
                            _filter = filter._filter,
                            _sort = filter._sort,
                            _order = filter._order,
                            CVUngVienId = filter.CVUngVienId
                        }));
                });
        }

        [HttpGet("show/{id}")]
        public async Task<IActionResult> Show(int id)
        {
            return await EnforcePermissionAndExecute(
                "ketquaphantichcvs",
                "show",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetKetQuaPhanTichCvByIdQuery
                        {
                            Id = id
                        }));
                });
        }

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] TaoKetQuaPhanTichCvDto dto)
        {
            return await EnforcePermissionAndExecute(
                "ketquaphantichcvs",
                "create",
                async () =>
                {
                    var command =
                        _mapper.Map<CreateKetQuaPhanTichCvCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] CapNhatKetQuaPhanTichCvDto dto)
        {
            return await EnforcePermissionAndExecute(
                "ketquaphantichcvs",
                "edit",
                async () =>
                {
                    if (id != dto.Id)
                    {
                        return BadRequest();
                    }

                    var command =
                        _mapper.Map<UpdateKetQuaPhanTichCvCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute(
                "ketquaphantichcvs",
                "delete",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new DeleteKetQuaPhanTichCvByIdCommand
                        {
                            Id = id
                        }));
                });
        }
    }
}