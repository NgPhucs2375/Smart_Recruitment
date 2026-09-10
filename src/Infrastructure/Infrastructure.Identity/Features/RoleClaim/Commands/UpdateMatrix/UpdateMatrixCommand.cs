using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Application.Wrappers;
using Infrastructure.Identity.Contexts;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Casbin;

namespace Infrastructure.Identity.Features.RoleClaim.Commands.UpdateMatrix
{
    public class UpdateMatrixCommand : IRequest<Response<object>>
    {
        // matrix: roleName -> resource -> actions[]
        public Dictionary<string, Dictionary<string, string[]>> Matrix { get; set; }
    }

    public class UpdateMatrixCommandHandler : IRequestHandler<UpdateMatrixCommand, Response<object>>
    {
        private readonly IdentityContext _context;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IWebHostEnvironment _env;
        private readonly Enforcer _enforcer;

        public UpdateMatrixCommandHandler(
            IdentityContext context,
            RoleManager<IdentityRole> roleManager,
            IWebHostEnvironment env,
            Enforcer enforcer)
        {
            _context = context;
            _roleManager = roleManager;
            _env = env;
            _enforcer = enforcer;
        }

        public async Task<Response<object>> Handle(UpdateMatrixCommand request, CancellationToken cancellationToken)
        {
            if (request.Matrix == null) throw new Application.Exceptions.ApiException("Matrix không được rỗng", 400);

            var allowedNames = new HashSet<string>(new[] {
                Domain.Enums.VaiTroNguoiDung.QUAN_TRI_VIEN.ToString(),
                Domain.Enums.VaiTroNguoiDung.NGUOI_DAI_DIEN.ToString(),
                Domain.Enums.VaiTroNguoiDung.NHAN_SU.ToString(),
                Domain.Enums.VaiTroNguoiDung.UNG_VIEN.ToString()
            });
            // Chỉ cho 4 role chuẩn VaiTroNguoiDung.cs:10-13
            foreach (var k in request.Matrix.Keys.ToList())
                if (!allowedNames.Contains(k))
                    throw new Application.Exceptions.ApiException($"Role {k} không hợp lệ — chỉ 4 role chuẩn được phép", 400);

            using var tx = await _context.Database.BeginTransactionAsync(cancellationToken);

            foreach (var roleEntry in request.Matrix)
            {
                var roleName = roleEntry.Key;
                var role = await _roleManager.FindByNameAsync(roleName);
                if (role == null) throw new Application.Exceptions.ApiException($"Role {roleName} không tồn tại", 404);

                var existingClaims = await _context.RoleClaims.Where(rc => rc.RoleId == role.Id).ToListAsync(cancellationToken);
                // Remove old claims for this role
                _context.RoleClaims.RemoveRange(existingClaims);
                await _context.SaveChangesAsync(cancellationToken);

                // Remove from Casbin enforcer
                await _enforcer.RemoveFilteredPolicyAsync(0, roleName);

                foreach (var resEntry in roleEntry.Value)
                {
                    var resource = resEntry.Key?.Trim();
                    var actions = resEntry.Value?.Where(a => !string.IsNullOrWhiteSpace(a)).Select(a => a.Trim()).Distinct().ToArray();
                    if (string.IsNullOrWhiteSpace(resource) || actions == null || actions.Length == 0) continue;

                    var claimValue = string.Join("#", actions);
                    _context.RoleClaims.Add(new IdentityRoleClaim<string>
                    {
                        RoleId = role.Id,
                        ClaimType = resource,
                        ClaimValue = claimValue
                    });

                    foreach (var act in actions)
                        await _enforcer.AddPolicyAsync(roleName, resource, act);
                }
            }

            await _context.SaveChangesAsync(cancellationToken);

            // Atomic write policy.csv cache — chỉ 4 role chuẩn
            var csvPath = Path.Combine(_env.WebRootPath, "policy.csv");
            var lines = new List<string>();
            var allRoles = await _roleManager.Roles.AsNoTracking().Where(r => allowedNames.Contains(r.Name)).ToListAsync(cancellationToken);
            foreach (var role in allRoles)
            {
                var claims = await _context.RoleClaims.AsNoTracking().Where(rc => rc.RoleId == role.Id).ToListAsync(cancellationToken);
                foreach (var rc in claims)
                {
                    var acts = rc.ClaimValue?.Split('#', StringSplitOptions.RemoveEmptyEntries) ?? Array.Empty<string>();
                    foreach (var act in acts)
                        lines.Add($"p, {role.Name}, {rc.ClaimType}, {act}");
                }
            }
            lines = lines.Distinct().OrderBy(s => s).ToList();
            var tmp = csvPath + ".tmp";
            await File.WriteAllLinesAsync(tmp, lines, cancellationToken);
            File.Move(tmp, csvPath, true);

            await _enforcer.SavePolicyAsync();
            await tx.CommitAsync(cancellationToken);

            return new Response<object>(true, new { updated = lines.Count }, "Cập nhật ma trận quyền thành công");
        }
    }
}
