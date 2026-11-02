using Application.DTOs.KinhNghiemLamViec;
using Application.Features.KinhNghiemLamViec.Commands.CreateKinhNghiemLamViec;
using Application.Features.KinhNghiemLamViec.Commands.DeleteKinhNghiemLamViec;
using Application.Features.KinhNghiemLamViec.Commands.UpdateKinhNghiemLamViec;
using Application.Features.KinhNghiemLamViec.Queries.GetAllKinhNghiemLamViecs;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/kinhnghiemlamviec")]
    public class KinhNghiemLamViecController : BaseApiController
    {
        private readonly IMapper _mapper;

        public KinhNghiemLamViecController(
            Microsoft.AspNetCore.Hosting.IWebHostEnvironment hostingEnvironment,
            IMapper mapper)
            : base(hostingEnvironment)
        {
            _mapper = mapper;
        }

        // GET: api/kinhnghiemlamviec
        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] GetAllKinhNghiemLamViecsParameter filter)
        {
            return await EnforcePermissionAndExecute(
                "kinhnghiemlamviec",
                "list",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetAllKinhNghiemLamViecsQuery
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

        // POST: api/kinhnghiemlamviec
        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] TaoKinhNghiemLamViecDto dto)
        {
            return await EnforcePermissionAndExecute(
                "kinhnghiemlamviec",
                "create",
                async () =>
                {
                    var command =
                        _mapper.Map<CreateKinhNghiemLamViecCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        // PUT: api/kinhnghiemlamviec/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] CapNhatKinhNghiemLamViecDto dto)
        {
            return await EnforcePermissionAndExecute(
                "kinhnghiemlamviec",
                "edit",
                async () =>
                {
                    if (id != dto.Id)
                    {
                        return BadRequest();
                    }

                    var command =
                        _mapper.Map<UpdateKinhNghiemLamViecCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        // DELETE: api/kinhnghiemlamviec/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute(
                "kinhnghiemlamviec",
                "delete",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new DeleteKinhNghiemLamViecByIdCommand
                        {
                            Id = id
                        }));
                });
        }
    }
}
