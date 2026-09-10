using Application.DTOs.DonUngTuyen;
using Application.Features.DonUngTuyen.Commands.CreateDonUngTuyen;
using Application.Features.DonUngTuyen.Commands.DeleteDonUngTuyen;
using Application.Features.DonUngTuyen.Commands.UpdateDonUngTuyen;
using Application.Features.DonUngTuyen.Queries.GetAllDonUngTuyens;
using Application.Features.DonUngTuyen.Queries.GetDonUngTuyenById;
using AutoMapper;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/donungtuyens")]
    public class DonUngTuyenController : BaseApiController
    {
        private readonly IMapper _mapper;

        public DonUngTuyenController(
            Microsoft.AspNetCore.Hosting.IWebHostEnvironment hostingEnvironment,
            Enforcer enforcer,
            IMapper mapper)
            : base(hostingEnvironment, enforcer)
        {
            _mapper = mapper;
        }

        // GET: api/donungtuyens
        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] GetAllDonUngTuyensParameter filter)
        {
            return await EnforcePermissionAndExecute(
                "donungtuyens",
                "list",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetAllDonUngTuyensQuery
                        {
                            _start = filter._start,
                            _end = filter._end,
                            _filter = filter._filter,
                            _sort = filter._sort,
                            _order = filter._order,
                            HoSoUngVienId = filter.HoSoUngVienId,
                            CVUngVienId = filter.CVUngVienId,
                            TinTuyenDungId = filter.TinTuyenDungId
                        }));
                });
        }

        // GET: api/donungtuyens/show/5
        [HttpGet("show/{id}")]
        public async Task<IActionResult> Show(int id)
        {
            return await EnforcePermissionAndExecute(
                "donungtuyens",
                "show",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetDonUngTuyenByIdQuery
                        {
                            Id = id
                        }));
                });
        }

        // POST: api/donungtuyens
        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] TaoDonUngTuyenDto dto)
        {
            return await EnforcePermissionAndExecute(
                "donungtuyens",
                "create",
                async () =>
                {
                    var command =
                        _mapper.Map<CreateDonUngTuyenCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        // PUT: api/donungtuyens/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] CapNhatDonUngTuyenDto dto)
        {
            return await EnforcePermissionAndExecute(
                "donungtuyens",
                "edit",
                async () =>
                {
                    if (id != dto.Id)
                    {
                        return BadRequest();
                    }

                    var command =
                        _mapper.Map<UpdateDonUngTuyenCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        // DELETE: api/donungtuyens/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute(
                "donungtuyens",
                "delete",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new DeleteDonUngTuyenByIdCommand
                        {
                            Id = id
                        }));
                });
        }
    }
}