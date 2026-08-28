#nullable enable
using System.Threading;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    /// <summary>
    /// Giải quyết email của người dùng từ Identity (ApplicationUser) dựa trên Id của NguoiDung.
    /// Đặt ở Application.Interfaces để Application không phụ thuộc trực tiếp vào Infrastructure.Identity.
    /// </summary>
    public interface IUserEmailResolver
    {
        Task<string?> GetEmailByNguoiDungIdAsync(int nguoiDungId, CancellationToken ct = default);
    }
}
