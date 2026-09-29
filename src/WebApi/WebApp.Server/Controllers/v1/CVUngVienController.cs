using Application.DTOs.CV;
using Application.Features.CVUngVien.Commands.CreateCVUngVien;
using Application.Features.CVUngVien.Commands.DeleteCVUngVien;
using Application.Features.CVUngVien.Commands.ImportCvUngVien;
using Application.Features.CVUngVien.Commands.ParseCvText;
using Application.Features.CVUngVien.Commands.PrepareCvImport;
using Application.Features.CVUngVien.Commands.SaveCvVersion;
using Application.Features.CVUngVien.Commands.UpdateCVUngVien;
using Application.Features.CVUngVien.Commands.SetDefaultCVUngVien;
using Application.Features.CVUngVien.Queries.GetAllCVUngViens;
using Application.Features.CVUngVien.Queries.GetCVDownloadUrl;
using Application.Features.CVUngVien.Queries.GetCVUngVienById;
using Application.Features.CVUngVien.Queries.GetCvVersions;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/cvungviens")]
    public class CVUngVienController : BaseApiController
    {
        public CVUngVienController(
            Microsoft.AspNetCore.Hosting.IWebHostEnvironment hostingEnvironment,
            Enforcer enforcer)
            : base(hostingEnvironment, enforcer)
        {
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
            [FromBody] CreateCVUngVienCommand command)
        {
            return await EnforcePermissionAndExecute(
                "cvungviens",
                "create",
                async () =>
                {
                    return Ok(await Mediator.Send(command));
                });
        }

        // PUT: api/cvungviens/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] UpdateCVUngVienCommand command)
        {
            return await EnforcePermissionAndExecute(
                "cvungviens",
                "edit",
                async () =>
                {
                    if (id != command.Id)
                    {
                        return BadRequest();
                    }

                    return Ok(await Mediator.Send(command));
                });
        }

        [HttpPost("import")]
        public async Task<IActionResult> Import([FromBody] ImportCvCommand command)
        {
            return await EnforcePermissionAndExecute(
                "cvungviens",
                "create",
                async () => Ok(await Mediator.Send(command)));
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

        [HttpPost("parse-text")]
        public async Task<IActionResult> ParseText(
            [FromBody] ParseCvTextCommand command)
        {
            return await EnforcePermissionAndExecute(
                "cvungviens",
                "create",
                async () =>
                {
                    return Ok(await Mediator.Send(command));
                });
        }

        [HttpPost("{id:int}/set-default")]
        public async Task<IActionResult> SetDefault(int id)
        {
            return await EnforcePermissionAndExecute(
                "cvungviens",
                "edit",
                async () => Ok(await Mediator.Send(new SetDefaultCVUngVienCommand { Id = id })));
        }

        [HttpPost("import/prepare")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> PrepareImport(
            [FromForm] PrepareCvImportCommand command,
            CancellationToken cancellationToken)
        {
            return await EnforcePermissionAndExecute(
                "cvungviens",
                "create",
                async () => Ok(await Mediator.Send(command, cancellationToken)));
        }

        [HttpPost("save-version")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> SaveVersion(
            [FromForm] SaveCvVersionCommand command,
            CancellationToken cancellationToken)
        {
            return await EnforcePermissionAndExecute(
                "cvungviens",
                "create",
                async () => Ok(await Mediator.Send(command, cancellationToken)));
        }

        [HttpGet("{id:int}/versions")]
        public async Task<IActionResult> GetVersions(int id, CancellationToken cancellationToken)
        {
            return await EnforcePermissionAndExecute(
                "cvungviens",
                "show",
                async () => Ok(await Mediator.Send(
                    new GetCvVersionsQuery { CVUngVienId = id }, cancellationToken)));
        }

        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Form_Data(
            [FromForm] CreateCVUngVienCommand command)
        {
            var result = await Mediator.Send(command);
            return Ok(result);
        }

        [HttpGet("{Id:int}/download-url")]
        public async Task<IActionResult> GetDownloadUrl(
            [FromRoute] GetCVDownloadUrlQuery query,
            CancellationToken cancellationToken)
        {
            return await EnforcePermissionAndExecute(
                "cvungviens",
                "download",
                async () =>
                {
                    var result = await Mediator.Send(
                        query,
                        cancellationToken);

                    return Ok(result);
                });
        }

        [HttpGet("{id:int}/versions/{versionId:int}/download-url")]
        public async Task<IActionResult> GetVersionDownloadUrl(
            int id,
            int versionId,
            CancellationToken cancellationToken)
        {
            return await EnforcePermissionAndExecute(
                "cvungviens",
                "download",
                async () => Ok(await Mediator.Send(new GetCVDownloadUrlQuery
                {
                    Id = id,
                    VersionId = versionId
                }, cancellationToken)));
        }

        [HttpGet("{id:int}/original/download-url")]
        public async Task<IActionResult> GetOriginalDownloadUrl(
            int id,
            CancellationToken cancellationToken)
        {
            return await EnforcePermissionAndExecute(
                "cvungviens",
                "download",
                async () => Ok(await Mediator.Send(new GetCVDownloadUrlQuery
                {
                    Id = id,
                    Original = true
                }, cancellationToken)));
        }
    }
}
