using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Application.Wrappers;
using Infrastructure.Identity.Contexts;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Identity.Features.RoleClaim.Queries.GetMatrix
{
    public class GetMatrixQuery : IRequest<Response<object>>
    {
        public class GetMatrixQueryHandler : IRequestHandler<GetMatrixQuery, Response<object>>
        {
            private readonly RoleManager<IdentityRole> _roleManager;
            private readonly IdentityContext _context;

            public GetMatrixQueryHandler(RoleManager<IdentityRole> roleManager, IdentityContext context)
            {
                _roleManager = roleManager;
                _context = context;
            }

            public async Task<Response<object>> Handle(GetMatrixQuery request, CancellationToken cancellationToken)
            {
                // Chuẩn chỉ 4 role theo Domain.Enums.VaiTroNguoiDung.cs:10-13
                var allowedNames = new HashSet<string>(new[] {
                    Domain.Enums.VaiTroNguoiDung.QUAN_TRI_VIEN.ToString(),
                    Domain.Enums.VaiTroNguoiDung.NGUOI_DAI_DIEN.ToString(),
                    Domain.Enums.VaiTroNguoiDung.NHAN_SU.ToString(),
                    Domain.Enums.VaiTroNguoiDung.UNG_VIEN.ToString()
                });
                var roles = await _roleManager.Roles.AsNoTracking()
                    .Where(r => allowedNames.Contains(r.Name))
                    .OrderBy(r => r.Name)
                    .ToListAsync(cancellationToken);
                // Load all RoleClaims grouped
                var claims = await _context.RoleClaims.AsNoTracking().ToListAsync(cancellationToken);

                // Build matrix: roleName -> resource -> actions[]
                var matrix = new Dictionary<string, Dictionary<string, string[]>>();
                var allResources = new HashSet<string>(Infrastructure.Identity.Services.PermissionPolicy.Resources);

                foreach (var role in roles)
                {
                    var roleClaims = claims.Where(c => c.RoleId == role.Id).ToList();
                    var resMap = new Dictionary<string, string[]>();
                    foreach (var rc in roleClaims)
                    {
                        if (string.IsNullOrWhiteSpace(rc.ClaimType) || !Infrastructure.Identity.Services.PermissionPolicy.Resources.Contains(rc.ClaimType)) continue;
                        var actions = rc.ClaimValue?.Split('#', System.StringSplitOptions.RemoveEmptyEntries) ?? System.Array.Empty<string>();
                        resMap[rc.ClaimType] = (resMap.GetValueOrDefault(rc.ClaimType) ?? System.Array.Empty<string>())
                            .Concat(actions).Where(a => Infrastructure.Identity.Services.PermissionPolicy.IsEffective(role.Name, rc.ClaimType, a)).Distinct().ToArray();
                        allResources.Add(rc.ClaimType);
                    }
                    matrix[role.Name] = resMap;
                }

                // Also include resources that appear in policy.csv but not yet in DB (fallback empty)
                var result = new
                {
                    roles = roles.Select(r => new { id = r.Id, name = r.Name }).ToList(),
                    resources = allResources.OrderBy(r => r).ToList(),
                    allowedActions = roles.ToDictionary(r => r.Name, r => Infrastructure.Identity.Services.PermissionPolicy.Resources
                        .ToDictionary(resource => resource, resource => Infrastructure.Identity.Services.PermissionPolicy.AllowedActions(r.Name, resource))),
                    matrix
                };

                return new Response<object>(true, result, "Success");
            }
        }
    }
}
