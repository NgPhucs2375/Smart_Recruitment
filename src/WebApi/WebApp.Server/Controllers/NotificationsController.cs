using System.Security.Claims;
using Application.Interfaces;
using Domain.Enums;
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

        public NotificationsController(IApplicationDbContext context, IAuthenticatedUserService auth)
        {
            _context = context;
            _auth = auth;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] bool unreadOnly = false)
        {
            var nd = await _context.NguoiDungs
                .FirstOrDefaultAsync(n => n.ApplicationUserId == _auth.UserId);

            if (nd == null)
                return Ok(new NotificationsVm { Notifications = new List<NotificationDto>(), UnreadCount = 0 });

            var query = _context.ThongBaos
                .Where(t => t.NguoiDungId == nd.Id)
                .AsNoTracking();

            if (unreadOnly)
                query = query.Where(t => !t.IsRead);

            var items = await query
                .OrderByDescending(t => t.Created)
                .Take(50)
                .Select(t => new NotificationDto
                {
                    Id = t.Id,
                    Message = t.TieuDe + (string.IsNullOrEmpty(t.NoiDung) ? "" : " - " + t.NoiDung),
                    Type = MapLoaiThongBao(t.LoaiThongBao),
                    IsRead = t.IsRead,
                    InvoiceId = null,
                    ApproverGroup = null,
                    Created = t.Created,
                })
                .ToListAsync();

            var unreadCount = await _context.ThongBaos
                .Where(t => t.NguoiDungId == nd.Id && !t.IsRead)
                .CountAsync();

            return Ok(new NotificationsVm
            {
                Notifications = items,
                UnreadCount = unreadCount,
            });
        }

        [HttpPost("read")]
        public async Task<IActionResult> MarkAllRead()
        {
            var nd = await _context.NguoiDungs
                .FirstOrDefaultAsync(n => n.ApplicationUserId == _auth.UserId);

            if (nd == null) return Ok();

            var unread = await _context.ThongBaos
                .Where(t => t.NguoiDungId == nd.Id && !t.IsRead)
                .ToListAsync();

            foreach (var t in unread)
                t.IsRead = true;

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
