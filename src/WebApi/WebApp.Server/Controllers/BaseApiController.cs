using System.Security.Claims;
using Casbin;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Application.Exceptions;
using Microsoft.AspNetCore.Hosting;
using Infrastructure.Identity.Contexts;
using Microsoft.EntityFrameworkCore;


namespace WebApp.Server.Controllers
{
    [ApiController]
    [Route("api/v{version:apiVersion}/[controller]")]
    public abstract class BaseApiController : ControllerBase
    {
        private IMediator _mediator;
        protected IMediator Mediator => _mediator ??= HttpContext.RequestServices.GetService<IMediator>();

        protected readonly Enforcer _enforcer;
        protected readonly string _webRootPath;

        public BaseApiController(Microsoft.AspNetCore.Hosting.IWebHostEnvironment webEnvironment, Enforcer enforcer)
        {
            _webRootPath = webEnvironment.WebRootPath;
            _enforcer = enforcer;
        }

        protected async Task<IActionResult> EnforcePermissionAndExecute(string resource, string action, Func<Task<IActionResult>> func)
        {
            if (HttpContext.User.Identity is ClaimsIdentity identity)
            {
                var roles = identity.FindAll(ClaimTypes.Role).Select(c=>c.Value).ToList();
                if (!roles.Any()) roles.Add(identity.FindFirst("permission")?.Value ?? "");
                var identityContext = HttpContext.RequestServices.GetRequiredService<IdentityContext>();
                var userId = identity.FindFirst("uid")?.Value
                    ?? identity.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrWhiteSpace(userId))
                {
                    var email = identity.FindFirst(ClaimTypes.Email)?.Value;
                    if (!string.IsNullOrWhiteSpace(email))
                    {
                        userId = await identityContext.Users
                            .Where(user => user.Email == email)
                            .Select(user => user.Id)
                            .FirstOrDefaultAsync();
                    }
                }
                if (!string.IsNullOrWhiteSpace(userId))
                {
                    var databaseRoles = await identityContext.UserRoles
                        .Where(userRole => userRole.UserId == userId)
                        .Join(
                            identityContext.Roles,
                            userRole => userRole.RoleId,
                            role => role.Id,
                            (_, role) => role.Name)
                        .Where(roleName => roleName != null)
                        .ToListAsync();
                    roles.AddRange(databaseRoles!);
                }
                roles = roles.Where(role => !string.IsNullOrWhiteSpace(role)).Distinct().ToList();
                bool allowed = false;
                foreach(var r in roles) if(await _enforcer.EnforceAsync(r, resource, action)) { allowed=true; break; }
                if (!allowed)
                {
                    var roleClaims = await identityContext.Roles
                        .Where(role => roles.Contains(role.Name))
                        .Join(
                            identityContext.RoleClaims,
                            role => role.Id,
                            claim => claim.RoleId,
                            (_, claim) => claim)
                        .Where(claim => claim.ClaimType == resource && claim.ClaimValue != null)
                        .Select(claim => claim.ClaimValue)
                        .ToListAsync();
                    allowed = roleClaims.Any(value =>
                        value.Split('#', StringSplitOptions.RemoveEmptyEntries)
                            .Contains(action, StringComparer.OrdinalIgnoreCase));
                }
                if(!allowed) throw new ApiException("Bạn không có quyền thực hiện hành động này.", 403);
                return await func();
            }
            throw new ApiException("Bạn không có quyền", 401);
        }
    }
}
