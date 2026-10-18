using Domain.Enums;

namespace Application.Interfaces;

public interface IUserRoleService
{
    Task SetRoleAsync(string applicationUserId, VaiTroNguoiDung role, bool? active = null, CancellationToken ct = default);
    /// <summary>Gỡ vai trò khỏi user, đồng bộ profile domain, có bù trừ 2 DbContext khi lỗi.</summary>
    Task RemoveRoleAsync(string applicationUserId, string roleName, CancellationToken ct = default);
}
