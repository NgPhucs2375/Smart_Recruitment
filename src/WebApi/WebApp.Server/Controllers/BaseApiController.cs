using System.Security.Claims;
using Casbin;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Application.Exceptions;
using Microsoft.AspNetCore.Hosting;


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
                var userPermission = identity.FindFirst("permission")?.Value;

                var enforcer = await _enforcer.EnforceAsync(userPermission, resource, action);
                if (!enforcer)
                {
                    throw new ApiException("Bạn không có quyền thực hiện hành động này.", 403);
                }
                return await func();
            }
            throw new ApiException("Bạn không có quyền", 401);
        }
    }
}
