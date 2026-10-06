using System.Security.Claims;
using Application.Exceptions;
using Casbin;
using Infrastructure.Identity.Contexts;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace WebApp.Server.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    private IMediator? _mediator;
    protected IMediator Mediator => _mediator ??= HttpContext.RequestServices.GetRequiredService<IMediator>();
    protected readonly Enforcer _enforcer;
    protected readonly string _webRootPath;
    protected BaseApiController(IWebHostEnvironment environment, Enforcer enforcer)
    { _webRootPath = environment.WebRootPath ?? ""; _enforcer = enforcer; }

    protected async Task<IActionResult> EnforcePermissionAndExecute(string resource, string action, Func<Task<IActionResult>> execute)
    {
        if (User.Identity?.IsAuthenticated != true) throw new ApiException("Bạn cần đăng nhập.", 401);
        var uid = User.FindFirst("uid")?.Value;
        if (string.IsNullOrWhiteSpace(uid)) throw new ApiException("Phiên đăng nhập không hợp lệ.", 401);
        var db = HttpContext.RequestServices.GetRequiredService<IdentityContext>();
        // Current database permissions are authoritative, not withdrawn JWT/CSV grants.
        var grants = await (from membership in db.UserRoles
                            join claim in db.RoleClaims on membership.RoleId equals claim.RoleId
                            where membership.UserId == uid && claim.ClaimType == resource
                            select claim.ClaimValue).ToListAsync(HttpContext.RequestAborted);
        if (!grants.Any(value => (value ?? "").Split('#', StringSplitOptions.RemoveEmptyEntries)
                .Contains(action, StringComparer.OrdinalIgnoreCase)))
            throw new ApiException("Bạn không có quyền thực hiện hành động này.", 403);
        return await execute();
    }
}
