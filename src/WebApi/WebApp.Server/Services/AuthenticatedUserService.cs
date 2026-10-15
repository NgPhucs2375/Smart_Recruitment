using Application.Interfaces;
using System.Security.Claims;

namespace WebApp.Server.Services
{
    public class AuthenticatedUserService : IAuthenticatedUserService
    {
        private readonly IHttpContextAccessor _accessor;
        public AuthenticatedUserService(IHttpContextAccessor httpContextAccessor)
        {
            _accessor = httpContextAccessor;
        }

        public string UserId => _accessor.HttpContext?.User?.FindFirstValue("uid") ?? string.Empty;
    }
}
