using Application.DTOs.CvTheme;
using Application.Features.CvTheme.Commands.CreateCvTheme;
using Application.Features.CvTheme.Commands.DeleteCvTheme;
using Application.Features.CvTheme.Commands.UpdateCvTheme;
using Application.Features.CvTheme.Commands.UploadCvThemePreview;
using Application.Features.CvTheme.Queries.GetActiveCvThemes;
using Application.Features.CvTheme.Queries.GetAllCvThemes;
using Application.Features.CvTheme.Queries.GetCvThemeById;
using Application.Interfaces;
using AutoMapper;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/cvthemes")]
    public class CvThemeController : BaseApiController
    {
        private readonly IMapper _mapper;
        private readonly IApplicationDbContext _context;
        private readonly IFileStorageService _storage;

        public CvThemeController(
            Microsoft.AspNetCore.Hosting.IWebHostEnvironment hostingEnvironment,
            Enforcer enforcer,
            IMapper mapper,
            IApplicationDbContext context,
            IFileStorageService storage)
            : base(hostingEnvironment, enforcer)
        {
            _mapper = mapper;
            _context = context;
            _storage = storage;
        }

        // GET: api/cvthemes
        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] GetAllCvThemesParameter filter)
        {
            return await EnforcePermissionAndExecute(
                "cvthemes",
                "list",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetAllCvThemesQuery
                        {
                            _start = filter._start,
                            _end = filter._end,
                            _order = filter._order,
                            _sort = filter._sort,
                            _filter = filter._filter
                        }));
                });
        }

        // GET: api/cvthemes/active — public cho gallery + AI gợi ý.
        [AllowAnonymous]
        [HttpGet("active")]
        public async Task<IActionResult> GetActive()
        {
            return Ok(await Mediator.Send(new GetActiveCvThemesQuery()));
        }

        // GET: api/cvthemes/show/5
        [HttpGet("show/{id}")]
        public async Task<IActionResult> Show(int id)
        {
            return await EnforcePermissionAndExecute(
                "cvthemes",
                "show",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetCvThemeByIdQuery
                        {
                            Id = id
                        }));
                });
        }

        // POST: api/cvthemes
        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] TaoCvThemeDto dto)
        {
            return await EnforcePermissionAndExecute(
                "cvthemes",
                "create",
                async () =>
                {
                    var command =
                        _mapper.Map<CreateCvThemeCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        // PUT: api/cvthemes/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] CapNhatCvThemeDto dto)
        {
            return await EnforcePermissionAndExecute(
                "cvthemes",
                "edit",
                async () =>
                {
                    if (id != dto.Id)
                    {
                        return BadRequest();
                    }

                    var command =
                        _mapper.Map<UpdateCvThemeCommand>(dto);

                    return Ok(await Mediator.Send(command));
                });
        }

        // DELETE: api/cvthemes/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute(
                "cvthemes",
                "delete",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new DeleteCvThemeByIdCommand
                        {
                            Id = id
                        }));
                });
        }

        // POST: api/cvthemes/5/preview
        [HttpPost("{id}/preview")]
        [RequestSizeLimit(5 * 1024 * 1024)]
        public async Task<IActionResult> UploadPreview(int id, [FromForm] IFormFile file)
        {
            return await EnforcePermissionAndExecute(
                "cvthemes",
                "edit",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new UploadCvThemePreviewCommand
                        {
                            ThemeId = id,
                            File = file
                        }));
                });
        }

        // GET: api/cvthemes/5/preview — public cho <img> gallery.
        [AllowAnonymous]
        [HttpGet("{id}/preview")]
        public async Task<IActionResult> GetPreview(int id, CancellationToken cancellationToken)
        {
            var objectName = await _context.CvThemes
                .AsNoTracking()
                .Where(theme => theme.Id == id)
                .Select(theme => theme.PreviewStorageKey)
                .FirstOrDefaultAsync(cancellationToken);

            if (string.IsNullOrWhiteSpace(objectName) || !objectName.StartsWith("cv-themes/"))
                return NotFound();

            var stream = await _storage.DownloadAsync(objectName, cancellationToken);
            var contentType = Path.GetExtension(objectName).ToLowerInvariant() switch
            {
                ".png" => "image/png",
                ".webp" => "image/webp",
                ".gif" => "image/gif",
                _ => "image/jpeg"
            };
            Response.Headers.CacheControl = "no-store, no-cache, must-revalidate";
            return File(stream, contentType);
        }
    }
}
