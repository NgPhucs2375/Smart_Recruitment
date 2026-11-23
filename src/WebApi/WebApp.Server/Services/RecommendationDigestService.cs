using Application.DTOs.ThongBao;
using Application.Features.KetQuaPhuHop.Queries.SuggestJobsForCv;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace WebApp.Server.Services;

/// <summary>
/// Digest gợi ý việc làm cho ứng viên. Chạy ngoài request (xem
/// <see cref="RecommendationDigestRunner"/>) để trang thông báo không chờ matching.
/// </summary>
public sealed class RecommendationDigestService(
    IApplicationDbContext context,
    ISender sender,
    INotificationService notifications)
{
    public async Task EnsureAsync(int userId, CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;
        var alreadySent = await context.Notifications
            .AnyAsync(n => n.ReferenceType == "RecommendationDigest"
                && n.ReferenceId == userId
                && n.Created >= today
                && n.Recipients.Any(r => r.NguoiDungId == userId), cancellationToken);
        if (alreadySent) return;

        // Fanout job đã gửi tin khớp nhất hôm nay thì không xếp thêm bản tin ngày trùng nội dung.
        var daDuocBanTinHomNay = await context.Notifications
            .AnyAsync(n => n.ReferenceType == "GoiYViecLamPhuHop"
                && n.Created >= today
                && n.Recipients.Any(r => r.NguoiDungId == userId), cancellationToken);
        if (daDuocBanTinHomNay) return;

        var response = await sender.Send(new GetSuggestedJobsForCvQuery
        {
            TopN = 10,
            PageNumber = 1,
            PageSize = 10,
            MinimumScore = 0.50f,
            // Job nền không có HttpContext nên truyền thẳng user đã xác thực ở request GET.
            NguoiDungIdOverride = userId,
        }, cancellationToken);
        var jobs = response.Data;
        if (jobs is null || jobs.Count == 0) return;

        var names = string.Join(", ", jobs.Take(5).Select(x => x.TieuDe));
        await notifications.SendToUserAsync(userId, new ThongBaoDTO
        {
            TieuDe = $"Có {jobs.Count} việc làm phù hợp với CV của bạn",
            NoiDung = $"Gợi ý: {names}{(jobs.Count > 5 ? " và các tin khác" : ".")}",
            LoaiThongBao = LoaiThongBao.ViecLamMoi,
            ReferenceType = "RecommendationDigest",
            ReferenceId = userId,
            NguoiDungId = userId,
        });
    }
}
