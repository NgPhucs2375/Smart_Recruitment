using Application.DTOs.DanhMucNghe;
using Application.Features.DanhMucNghe.Commands.CreateDanhMucNghe;
using Application.Features.DanhMucNghe.Commands.DeleteDanhMucNghe;
using Application.Features.DanhMucNghe.Commands.UpdateDanhMucNghe;
using Application.Features.DanhMucNghe.Queries.GetAllDanhMucNghes;
using Application.Features.DanhMucNghe.Queries.GetDanhMucNgheById;
using AutoMapper;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/danhmucnghes")]
    public class DanhMucNgheController : BaseApiController
    {
        private readonly IMapper _mapper;

        public DanhMucNgheController(
            Microsoft.AspNetCore.Hosting.IWebHostEnvironment hostingEnvironment,
            Enforcer enforcer,
            IMapper mapper)
            : base(hostingEnvironment, enforcer)
        {
            _mapper = mapper;
        }

        // GET: api/danhmucnghes
        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] GetAllDanhMucNghesParameter filter)
        {
            return await EnforcePermissionAndExecute(
                "danhmucnghes",
                "list",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetAllDanhMucNghesQuery
                        {
                            _start = filter._start,
                            _end = filter._end,
                            _order = filter._order,
                            _sort = filter._sort,
                            _filter = filter._filter
                        }));
                });
        }

        // GET: api/danhmucnghes/show/5
        [HttpGet("show/{id}")]
        public async Task<IActionResult> Show(int id)
        {
            return await EnforcePermissionAndExecute(
                "danhmucnghes",
                "show",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetDanhMucNgheByIdQuery
                        {
                            Id = id
                        }));
                });
        }

        // POST: api/danhmucnghes
        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] TaoDanhMucNgheDto dto)
        {
            return await EnforcePermissionAndExecute(
                "danhmucnghes",
                "create",
                async () =>
                {
                    var command =
                        _mapper.Map<CreateDanhMucNgheCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        // PUT: api/danhmucnghes/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] CapNhatDanhMucNgheDto dto)
        {
            return await EnforcePermissionAndExecute(
                "danhmucnghes",
                "edit",
                async () =>
                {
                    if (id != dto.Id)
                    {
                        return BadRequest();
                    }

                    var command =
                        _mapper.Map<UpdateDanhMucNgheCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        // DELETE: api/danhmucnghes/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute(
                "danhmucnghes",
                "delete",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new DeleteDanhMucNgheByIdCommand
                        {
                            Id = id
                        }));
                });
        }
    }
}