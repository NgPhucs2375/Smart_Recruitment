using Application.DTOs.CV;
using Application.Features.CVUngVien.Commands.CreateCVUngVien;
using Application.Features.CVUngVien.Commands.DeleteCVUngVien;
using Application.Features.CVUngVien.Commands.UpdateCVUngVien;
using Application.Features.CVUngVien.Queries.GetAllCVUngViens;
using Application.Features.CVUngVien.Queries.GetCVUngVienById;
using AutoMapper;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/cvungviens")]
    public class CVUngVienController : BaseApiController
    {
        private readonly IMapper _mapper;

        public CVUngVienController(
            Microsoft.AspNetCore.Hosting.IWebHostEnvironment hostingEnvironment,
            Enforcer enforcer,
            IMapper mapper)
            : base(hostingEnvironment, enforcer)
        {
            _mapper = mapper;
        }

        // GET: api/cvungviens
        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] GetAllCVUngViensParameter filter)
        {
            return await EnforcePermissionAndExecute(
                "cvungviens",
                "list",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetAllCVUngViensQuery
                        {
                            _start = filter._start,
                            _end = filter._end,
                            HoSoUngVienId = filter.HoSoUngVienId,
                            _filter = filter._filter,
                            _sort = filter._sort,
                            _order = filter._order
                        }));
                });
        }

        // GET: api/cvungviens/show/5
        [HttpGet("show/{id}")]
        public async Task<IActionResult> Show(int id)
        {
            return await EnforcePermissionAndExecute(
                "cvungviens",
                "show",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetCVUngVienByIdQuery
                        {
                            Id = id
                        }));
                });
        }

        // POST: api/cvungviens
        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] TaoCVUngVienDto dto)
        {
            return await EnforcePermissionAndExecute(
                "cvungviens",
                "create",
                async () =>
                {
                    var command =
                        _mapper.Map<CreateCVUngVienCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        // PUT: api/cvungviens/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] CapNhatCVUngVienDto dto)
        {
            return await EnforcePermissionAndExecute(
                "cvungviens",
                "edit",
                async () =>
                {
                    if (id != dto.Id)
                    {
                        return BadRequest();
                    }

                    var command =
                        _mapper.Map<UpdateCVUngVienCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        // DELETE: api/cvungviens/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute(
                "cvungviens",
                "delete",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new DeleteCVUngVienByIdCommand
                        {
                            Id = id
                        }));
                });
        }
    }
}