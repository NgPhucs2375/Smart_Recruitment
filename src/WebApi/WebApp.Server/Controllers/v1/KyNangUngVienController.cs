using Application.DTOs.KyNangUngVien;
using Application.Features.KyNangUngVien.Commands.CreateKyNangUngVien;
using Application.Features.KyNangUngVien.Commands.DeleteKyNangUngVien;
using Application.Features.KyNangUngVien.Commands.UpdateKyNangUngVien;
using Application.Features.KyNangUngVien.Queries.GetAllKyNangUngViens;
using Application.Features.KyNangUngVien.Queries.GetKyNangUngVienById;
using AutoMapper;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/kynangungviens")]
    public class KyNangUngVienController : BaseApiController
    {
        private readonly IMapper _mapper;

        public KyNangUngVienController(
            Microsoft.AspNetCore.Hosting.IWebHostEnvironment hostingEnvironment,
            Enforcer enforcer,
            IMapper mapper)
            : base(hostingEnvironment, enforcer)
        {
            _mapper = mapper;
        }

        // GET: api/kynangungviens
        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] GetAllKyNangUngViensParameter filter)
        {
            return await EnforcePermissionAndExecute(
                "kynangungviens",
                "list",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetAllKyNangUngViensQuery
                        {
                            _start = filter._start,
                            _end = filter._end,
                            _filter = filter._filter,
                            _sort = filter._sort,
                            _order = filter._order,
                            HoSoUngVienId = filter.HoSoUngVienId
                        }));
                });
        }

        // GET: api/kynangungviens/show/5
        [HttpGet("show/{id}")]
        public async Task<IActionResult> Show(int id)
        {
            return await EnforcePermissionAndExecute(
                "kynangungviens",
                "show",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetKyNangUngVienByIdQuery
                        {
                            Id = id
                        }));
                });
        }

        // POST: api/kynangungviens
        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] TaoKyNangUngVienDto dto)
        {
            return await EnforcePermissionAndExecute(
                "kynangungviens",
                "create",
                async () =>
                {
                    var command =
                        _mapper.Map<CreateKyNangUngVienCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        // PUT: api/kynangungviens/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] CapNhatKyNangUngVienDto dto)
        {
            return await EnforcePermissionAndExecute(
                "kynangungviens",
                "edit",
                async () =>
                {
                    if (id != dto.Id)
                    {
                        return BadRequest();
                    }

                    var command =
                        _mapper.Map<UpdateKyNangUngVienCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        // DELETE: api/kynangungviens/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute(
                "kynangungviens",
                "delete",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new DeleteKyNangUngVienByIdCommand
                        {
                            Id = id
                        }));
                });
        }
    }
}
