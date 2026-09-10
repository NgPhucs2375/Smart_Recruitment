using Application.DTOs.ThongBao;

namespace Application.Interfaces.Repositories;

public interface INotificationService
{
    Task SendToUserAsync(int userId, ThongBaoDTO notification);
    Task SendToCompanyAsync(int companyId, ThongBaoDTO notification);
    Task SendToRoleAsync(string role, ThongBaoDTO notification);
}