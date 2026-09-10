using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Application.Wrappers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Infrastructure.Identity.Features.Users.Queries.GetMeByToken
{
    public class GetMeByTokenQuery : IRequest<Response<GetMeByTokenQueryModel>>
    {
        public ClaimsIdentity Identity { get; set; }

        public class GetMeByTokenQueryHandler : IRequestHandler<GetMeByTokenQuery, Response<GetMeByTokenQueryModel>>
        {

            public GetMeByTokenQueryHandler()
            {
            }

            public async Task<Response<GetMeByTokenQueryModel>> Handle(GetMeByTokenQuery request, CancellationToken cancellationToken)
            {
                var email = FindClaimValue(request.Identity, ClaimTypes.Email);
                var name = FindClaimValue(request.Identity, ClaimTypes.NameIdentifier);
                var fullname = FindClaimValue(request.Identity, "fullname");
                var allRoleValues = FindAllClaimValues(request.Identity, ClaimTypes.Role).ToList();
                // JWT inbound mapping có thể đẩy claim "roles" (chuỗi JSON quyền)
                // vào nhóm Role — loại blob JSON khỏi danh sách vai trò.
                var roles = allRoleValues.Where(v => !IsJsonBlob(v)).ToArray();
                var uid = FindClaimValue(request.Identity, "uid");
                var avatarUrl = FindClaimValue(request.Identity, "AvatarUrl");
                var avatarUid = FindClaimValue(request.Identity, "AvatarUid");
                // Fallbacks for frontend shape
                var userName = FindClaimValue(request.Identity, "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name") 
                    ?? FindClaimValue(request.Identity, ClaimTypes.Name) 
                    ?? FindClaimValue(request.Identity, System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub) 
                    ?? name ?? email;
                var id = uid ?? FindClaimValue(request.Identity, ClaimTypes.NameIdentifier) ?? "";

                // Parse permissions from "roles" JSON claims (injected by AccountService.GenerateJWToken)
                // + fallback: blob JSON nằm lẫn trong Role claims do inbound mapping.
                var permissions = new List<PermissionDto>();
                var roleJsonClaims = request.Identity.FindAll("roles").Select(c => c.Value)
                    .Concat(allRoleValues.Where(IsJsonBlob))
                    .ToList();
                foreach (var json in roleJsonClaims)
                {
                    try
                    {
                        var jo = JObject.Parse(json);
                        var perms = jo["permissions"] as JArray;
                        if (perms == null) continue;
                        foreach (var p in perms)
                        {
                            var resource = p["resource"]?.ToString();
                            var actions = p["action"] as JArray;
                            if (string.IsNullOrWhiteSpace(resource) || actions == null) continue;
                            foreach (var act in actions)
                            {
                                var action = act.ToString();
                                if (!string.IsNullOrWhiteSpace(action))
                                    permissions.Add(new PermissionDto { Resource = resource, Action = action });
                            }
                        }
                    }
                    catch { /* ignore malformed */ }
                }

                // Fallback: if no "roles" JSON claim, try RoleClaims via ClaimTypes.Role? keep empty
                await Task.CompletedTask;
                return new Response<GetMeByTokenQueryModel>(new GetMeByTokenQueryModel
                {
                    Email = email,
                    Name = name,
                    Fullname = fullname,
                    Roles = roles,
                    Uid = uid,
                    Id = id,
                    UserName = userName,
                    AvatarUrl = avatarUrl,
                    AvatarUid = avatarUid,
                    Permissions = permissions
                });

            }
        }

        private static string FindClaimValue(ClaimsIdentity identity, string claimType)
        {
            return identity.FindFirst(claimType)?.Value;
        }

        private static bool IsJsonBlob(string value)
        {
            return !string.IsNullOrWhiteSpace(value)
                && value.TrimStart().StartsWith("{");
        }

        private static IEnumerable<string> FindAllClaimValues(ClaimsIdentity identity, string claimType)
        {
            return identity.FindAll(claimType).Select(x => x.Value);
        }
    }
}
