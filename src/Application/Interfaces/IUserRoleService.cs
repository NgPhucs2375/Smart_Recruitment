using Domain.Enums;

namespace Application.Interfaces;

public interface IUserRoleService
{
    Task SetRoleAsync(string applicationUserId, VaiTroNguoiDung role, bool? active = null, CancellationToken ct = default);
}
