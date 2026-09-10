using Application.DTOs.DoanhNghiep;
using Application.Features.DoanhNghiep.Commands.CreateDoanhNghiep;
using Application.Features.DoanhNghiep.Commands.DeleteDoanhNghiep;
using Application.Features.DoanhNghiep.Commands.UpdateDoanhNghiep;
using Application.Features.DoanhNghiep.Queries.GetAllDoanhNghieps;
using Application.Features.DoanhNghiep.Queries.GetDoanhNghiepById;
using AutoMapper;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/doanhnghieps")]
    public class DoanhNghiepController : BaseApiController
    {
        private readonly IMapper _mapper;

        public DoanhNghiepController(
            Microsoft.AspNetCore.Hosting.IWebHostEnvironment hostingEnvironment,
            Enforcer enforcer,
            IMapper mapper)
            : base(hostingEnvironment, enforcer)
        {
            _mapper = mapper;
        }

        // GET: api/doanhnghieps
        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] GetAllDoanhNghiepsParameter filter)
        {
            return await EnforcePermissionAndExecute(
                "doanhnghieps",
                "list",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetAllDoanhNghiepsQuery
                        {
                            _start = filter._start,
                            _end = filter._end,
                            _order = filter._order,
                            _sort = filter._sort,
                            _filter = filter._filter
                        }));
                });
        }

        // GET: api/doanhnghieps/show/5
        [HttpGet("show/{id}")]
        public async Task<IActionResult> Show(int id)
        {
            return await EnforcePermissionAndExecute(
                "doanhnghieps",
                "show",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetDoanhNghiepByIdQuery
                        {
                            Id = id
                        }));
                });
        }

        // POST: api/doanhnghieps
        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] TaoDoanhNghiepDto dto)
        {
            return await EnforcePermissionAndExecute(
                "doanhnghieps",
                "create",
                async () =>
                {
                    var command =
                        _mapper.Map<CreateDoanhNghiepCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        // PUT: api/doanhnghieps/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] CapNhatDoanhNghiepDto dto)
        {
            return await EnforcePermissionAndExecute(
                "doanhnghieps",
                "edit",
                async () =>
                {
                    if (id != dto.Id)
                    {
                        return BadRequest();
                    }

                    var command =
                        _mapper.Map<UpdateDoanhNghiepCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        // DELETE: api/doanhnghieps/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute(
                "doanhnghieps",
                "delete",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new DeleteDoanhNghiepByIdCommand
                        {
                            Id = id
                        }));
                });
        }
    }
}