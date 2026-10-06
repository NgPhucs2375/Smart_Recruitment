using System.Security.Claims;
using Application.DTOs.ThongBao;
using Application.Features.KetQuaPhuHop.Queries.SuggestCandidatesForJob;
using Application.Features.KetQuaPhuHop.Queries.SuggestJobsForCv;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace WebApp.Server.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        private readonly IApplicationDbContext _context;
        private readonly IAuthenticatedUserService _auth;
        private readonly ICurrentNguoiDungService _current;
        private readonly ISender _sender;
        private readonly INotificationService _notifications;

        public NotificationsController(
            IApplicationDbContext context,
            IAuthenticatedUserService auth,
            ICurrentNguoiDungService current,
            ISender sender,
            INotificationService notifications)
        {
            _context = context;
            _auth = auth;
            _current = current;
            _sender = sender;
            _notifications = notifications;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] bool unreadOnly = false)
        {
            var nd = await _context.NguoiDungs
                .FirstOrDefaultAsync(n => n.ApplicationUserId == _auth.UserId);

            if (nd == null)
                return Ok(new NotificationsVm { Notifications = new List<NotificationDto>(), UnreadCount = 0 });

            await EnsureRecommendationDigestAsync(nd.Id);

            var query = _context.NotificationRecipients
                .Where(r => r.NguoiDungId == nd.Id)
                .AsNoTracking();

            if (unreadOnly)
                query = query.Where(r => !r.IsRead);

            var items = await query
                .OrderByDescending(r => r.Notification.Created)
                .Take(50)
                .Select(r => new NotificationDto
                {
                    Id = r.NotificationId,
                    Message = r.Notification.TieuDe + (string.IsNullOrEmpty(r.Notification.NoiDung) ? "" : " - " + r.Notification.NoiDung),
                    Type = MapLoaiThongBao(r.Notification.LoaiThongBao),
                    IsRead = r.IsRead,
                    InvoiceId = null,
                    ApproverGroup = null,
                    Created = r.Notification.Created,
                })
                .ToListAsync();

            var unreadCount = await _context.NotificationRecipients
                .Where(r => r.NguoiDungId == nd.Id && !r.IsRead)
                .CountAsync();

            return Ok(new NotificationsVm
            {
                Notifications = items,
                UnreadCount = unreadCount,
            });
        }

        private async Task EnsureRecommendationDigestAsync(int userId)
        {
            var today = DateTime.UtcNow.Date;
            var alreadySent = await _context.Notifications
                .AnyAsync(n => n.ReferenceType == "RecommendationDigest"
                    && n.ReferenceId == userId
                    && n.Created >= today
                    && n.Recipients.Any(r => r.NguoiDungId == userId));
            if (alreadySent) return;

            var current = await _current.ResolveAsync();
            if (current.VaiTro == VaiTroNguoiDung.UNG_VIEN)
            {
                var response = await _sender.Send(new GetSuggestedJobsForCvQuery
                {
                    TopN = 10,
                    PageNumber = 1,
                    PageSize = 10,
                    MinimumScore = 0.50f,
                });
                var jobs = response.Data ?? new List<SuggestedJobViewModel>();
                if (jobs.Count == 0) return;

                var names = string.Join(", ", jobs.Take(5).Select(x => x.TieuDe));
                await _notifications.SendToUserAsync(userId, new ThongBaoDTO
                {
                    TieuDe = $"Có {jobs.Count} việc làm phù hợp với CV của bạn",
                    NoiDung = $"Gợi ý: {names}{(jobs.Count > 5 ? " và các tin khác" : ".")}",
                    LoaiThongBao = LoaiThongBao.ViecLamMoi,
                    ReferenceType = "RecommendationDigest",
                    ReferenceId = userId,
                    NguoiDungId = userId,
                });
                return;
            }

            if (current.VaiTro is not (VaiTroNguoiDung.NHAN_SU or VaiTroNguoiDung.NGUOI_DAI_DIEN)
                || !current.DoanhNghiepId.HasValue)
                return;

            var jobsForCompany = await _context.TinTuyenDungs
                .AsNoTracking()
                .Where(x => x.DoanhNghiepId == current.DoanhNghiepId.Value
                    && x.TrangThai == TrangThaiTinTuyenDung.DangTuyen
                    && (x.NgayHetHan == null || x.NgayHetHan > DateTime.UtcNow))
                .OrderByDescending(x => x.Id)
                .Take(3)
                .Select(x => new { x.Id, x.TieuDe })
                .ToListAsync();

            var parts = new List<string>();
            var totalCandidates = 0;
            foreach (var job in jobsForCompany)
            {
                var response = await _sender.Send(new GetSuggestedCandidatesForJobQuery
                {
                    TinTuyenDungId = job.Id,
                    TopN = 5,
                });
                var count = response.Data?.Count ?? 0;
                if (count == 0) continue;
                totalCandidates += count;
                parts.Add($"{job.TieuDe}: {count} ứng viên");
            }

            if (totalCandidates == 0) return;
            await _notifications.SendToUserAsync(userId, new ThongBaoDTO
            {
                TieuDe = $"Có {totalCandidates} ứng viên phù hợp với tin tuyển dụng",
                NoiDung = string.Join("; ", parts),
                LoaiThongBao = LoaiThongBao.CVUngVien,
                ReferenceType = "RecommendationDigest",
                ReferenceId = userId,
                NguoiDungId = userId,
                DoanhNghiepId = current.DoanhNghiepId,
            });
        }

        [HttpPost("read")]
        public async Task<IActionResult> MarkAllRead()
        {
            var nd = await _context.NguoiDungs
                .FirstOrDefaultAsync(n => n.ApplicationUserId == _auth.UserId);

            if (nd == null) return Ok();

            var unread = await _context.NotificationRecipients
                .Where(r => r.NguoiDungId == nd.Id && !r.IsRead)
                .ToListAsync();

            foreach (var recipient in unread)
                recipient.IsRead = true;

            await _context.SaveChangesAsync(CancellationToken.None);
            return Ok();
        }

        [HttpPost("read/{notificationId:int}")]
        public async Task<IActionResult> MarkRead(int notificationId)
        {
            var nd = await _context.NguoiDungs
                .FirstOrDefaultAsync(n => n.ApplicationUserId == _auth.UserId);

            if (nd == null) return Ok();

            var recipient = await _context.NotificationRecipients
                .FirstOrDefaultAsync(r => r.NguoiDungId == nd.Id
                    && r.NotificationId == notificationId);

            if (recipient == null) return NotFound();

            recipient.IsRead = true;
            await _context.SaveChangesAsync(CancellationToken.None);
            return Ok();
        }

        private static int MapLoaiThongBao(LoaiThongBao loai) => loai switch
        {
            LoaiThongBao.ViecLamMoi => 0,
            LoaiThongBao.LichPhongVan => 1,
            LoaiThongBao.DonUngTuyen => 3,
            _ => 0,
        };
    }

    public class NotificationsVm
    {
        public List<NotificationDto> Notifications { get; set; } = new();
        public int UnreadCount { get; set; }
    }

    public class NotificationDto
    {
        public int Id { get; set; }
        public string Message { get; set; } = "";
        public int Type { get; set; }
        public bool IsRead { get; set; }
        public int? InvoiceId { get; set; }
        public string? ApproverGroup { get; set; }
        public DateTime Created { get; set; }
    }
}
