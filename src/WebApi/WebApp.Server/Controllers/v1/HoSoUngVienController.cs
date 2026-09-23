using Application.DTOs.HoSoUngVien;
using Application.Features.HoSoUngVien.Queries.GetAllHoSoUngViens;
using Application.Features.HoSoUngVien.Queries.GetHoSoUngVienById;
using Application.Features.HoSoUngVien.Queries.GetMyHoSoUngVien;
using Application.Features.HoSoUngVien.Commands.CreateHoSoUngVien;
using Application.Features.HoSoUngVien.Commands.UpdateHoSoUngVien;
using Application.Features.HoSoUngVien.Commands.DeleteHoSoUngVien;
using Application.Features.HoSoUngVien.Commands.UpdateHoSoUngVienAvatar;
using Application.Interfaces;
using AutoMapper;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace WebApp.Server.Controllers.v1
{
     [Authorize]
     [Route("api/hosoungviens")]
     public class HoSoUngVienController : BaseApiController
     {
         private readonly IMapper _mapper;
         private readonly IApplicationDbContext _context;
         private readonly IFileStorageService _storage;
         public HoSoUngVienController(
             Microsoft.AspNetCore.Hosting.IWebHostEnvironment hostingEnvironment,
             Enforcer enforcer,
             IMapper mapper,
             IApplicationDbContext context,
             IFileStorageService storage) : base(hostingEnvironment,enforcer)
         {
             _mapper = mapper;
             _context = context;
             _storage = storage;
         }


         // GET: api/<controller>
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] GetAllHoSoUngViensParameter filter)
        {
             return await EnforcePermissionAndExecute("hosoungviens", "list", async () =>
             {
                 return Ok(await Mediator.Send(new GetAllHoSoUngViensQuery()
                 {
                     _end = filter._end,
                    _start = filter._start,
                     _order = filter._order,
                    _sort = filter._sort,
                     _filter = filter._filter                 
                }));
             });
        }
          // GET: api/hosoungviens/cua-toi
        [HttpGet("cua-toi")]
        public async Task<IActionResult> CuaToi()
        {
            return await EnforcePermissionAndExecute("hosoungviens", "show", async () =>
            {
                return Ok(await Mediator.Send(new GetMyHoSoUngVienQuery()));
            });
        }
          // GET: api/roles/show/5
        [HttpGet("show/{id}")]
        public async Task<IActionResult> Show(int id)
        {
            return await EnforcePermissionAndExecute("hosoungviens", "show", async () =>
            {
                return Ok(await Mediator.Send(new GetHoSoUngVienByIdQuery() { Id = id }));
            });
        }

        // POST: api/hosoungviens
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TaoHoSoUngVienDto dto)
        {
            return await EnforcePermissionAndExecute("hosoungviens", "create", async () =>
            {
                var command = _mapper.Map<CreateHoSoUngVienCommand>(dto);
                return Ok(await Mediator.Send(command));
            });
        }

        // PUT: api/hosoungviens/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CapNhatHoSoUngVienDto dto)
        {
            return await EnforcePermissionAndExecute("hosoungviens", "edit", async () =>
            {
                if (id != dto.Id)
                {
                    return BadRequest();
                }
                var command = _mapper.Map<UpdateHoSoUngVienCommand>(dto);
                return Ok(await Mediator.Send(command));
            });
        }

        [HttpPost("{id}/avatar")]
        [RequestSizeLimit(5 * 1024 * 1024)]
        public async Task<IActionResult> UploadAvatar(int id, [FromForm] IFormFile file)
        {
            return await EnforcePermissionAndExecute("hosoungviens", "edit", async () =>
                Ok(await Mediator.Send(new UpdateHoSoUngVienAvatarCommand
                {
                    HoSoUngVienId = id,
                    File = file
                })));
        }

        [HttpDelete("{id}/avatar")]
        public async Task<IActionResult> DeleteAvatar(int id)
        {
            return await EnforcePermissionAndExecute("hosoungviens", "edit", async () =>
                Ok(await Mediator.Send(new DeleteHoSoUngVienAvatarCommand
                {
                    HoSoUngVienId = id
                })));
        }

        [AllowAnonymous]
        [HttpGet("{id}/avatar")]
        public async Task<IActionResult> GetAvatar(int id, [FromQuery] string? key, CancellationToken cancellationToken)
        {
            var storedObjectName = await _context.HoSoUngViens
                .AsNoTracking()
                .Where(profile => profile.Id == id)
                .Select(profile => profile.AnhDaiDienUrl)
                .FirstOrDefaultAsync(cancellationToken);

            // The key is only accepted for this profile's avatar prefix. This keeps
            // the endpoint scoped while allowing the freshly returned upload key to
            // render before a stale profile projection is refreshed.
            var objectName = !string.IsNullOrWhiteSpace(key) && key.StartsWith($"avatars/{id}/", StringComparison.Ordinal)
                ? key
                : storedObjectName;

            if (string.IsNullOrWhiteSpace(objectName) || !objectName.StartsWith($"avatars/{id}/", StringComparison.Ordinal))
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

        // DELETE: api/hosoungviens/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute("hosoungviens", "delete", async () =>
            {
                return Ok(await Mediator.Send(new DeleteHoSoUngVienByIdCommand { Id = id }));
            });
        }


    }
}
