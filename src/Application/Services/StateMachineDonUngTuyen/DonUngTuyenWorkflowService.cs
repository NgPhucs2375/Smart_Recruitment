using Application.DTOs.Email;
using Application.DTOs.ThongBao;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Services.StateMachineDonUngTuyen;

public class DonUngTuyenWorkflowService(IApplicationDbContext context, IEmailService email,
    IUserEmailResolver resolver, INotificationPushService push, ILogger<DonUngTuyenWorkflowService> logger)
    : IDonUngTuyenWorkflowService
{
    public async Task HandleSideEffectsAsync(DonUngTuyen application, TriggerDonUngTuyen trigger, string note, CancellationToken ct = default)
    {
        var profileId = application.HoSoUngVienId ?? application.CVUngVien?.HoSoUngVienId
            ?? await context.CVUngViens.AsNoTracking().Where(x => x.Id == application.CVUngVienId).Select(x => x.HoSoUngVienId).FirstOrDefaultAsync(ct);
        var candidate = await context.HoSoUngViens.AsNoTracking().Where(x => x.Id == profileId).Select(x => x.NguoiDungId).FirstOrDefaultAsync(ct);
        var job = application.TinTuyenDung ?? await context.TinTuyenDungs.AsNoTracking().FirstOrDefaultAsync(x => x.Id == application.TinTuyenDungId, ct);
        var title = job?.TieuDe ?? "vị trí ứng tuyển";
        var subject = trigger switch
        {
            TriggerDonUngTuyen.XuLyHoSoThanhCong => "Đã nhận hồ sơ ứng tuyển",
            TriggerDonUngTuyen.XemDon => "Nhà tuyển dụng đã xem hồ sơ",
            TriggerDonUngTuyen.DanhGiaPhuHop => "Hồ sơ được đánh giá phù hợp",
            TriggerDonUngTuyen.TuChoi => "Kết quả ứng tuyển: chưa phù hợp",
            TriggerDonUngTuyen.RutDon => "Đơn ứng tuyển đã rút",
            TriggerDonUngTuyen.NopLaiHoSo => "Đã nhận lại hồ sơ",
            TriggerDonUngTuyen.XuLyHoSoThatBai => "Hồ sơ gặp sự cố kỹ thuật",
            TriggerDonUngTuyen.HetHanXuLy => "Đơn ứng tuyển quá hạn xử lý",
            TriggerDonUngTuyen.DongBoiTinTuyenDung => "Tin tuyển dụng đã đóng",
            _ => "Cập nhật đơn ứng tuyển"
        };
        var body = $"{subject} cho vị trí {title}.";
        if (!string.IsNullOrWhiteSpace(note)) body += $"\nGhi chú: {note}";
        if (candidate > 0) AddNotification(candidate, subject, body, application);
        var recruiterAction = trigger is TriggerDonUngTuyen.XemDon or TriggerDonUngTuyen.DanhGiaPhuHop or TriggerDonUngTuyen.TuChoi;
        if (!recruiterAction && job?.NguoiDangTinId > 0)
            AddNotification(job.NguoiDangTinId, trigger == TriggerDonUngTuyen.RutDon ? "Ứng viên đã rút đơn" : "Cập nhật hồ sơ ứng tuyển", body, application);
        if (candidate > 0 && trigger is TriggerDonUngTuyen.XuLyHoSoThanhCong or TriggerDonUngTuyen.DanhGiaPhuHop or TriggerDonUngTuyen.TuChoi or TriggerDonUngTuyen.RutDon or TriggerDonUngTuyen.DongBoiTinTuyenDung)
            QueueEmail(candidate, subject, body);
        if (trigger == TriggerDonUngTuyen.XuLyHoSoThanhCong && job?.NguoiDangTinId > 0)
            QueueEmail(job.NguoiDangTinId, "Đơn ứng tuyển mới", $"Tin {title} vừa nhận hồ sơ ứng tuyển mới.");
    }

    private void AddNotification(int recipient, string subject, string body, DonUngTuyen application)
    {
        var notification = new Notification
        {
            LoaiThongBao = LoaiThongBao.DonUngTuyen, TieuDe = subject, NoiDung = body,
            ReferenceType = nameof(DonUngTuyen), ReferenceId = application.Id,
            Recipients = new List<NotificationRecipient> { new() { NguoiDungId = recipient, IsRead = false } }
        };
        context.Notifications.Add(notification);
        context.EnqueueAfterSave(async token =>
        {
            try
            {
                await push.PushToUserAsync(recipient, new ThongBaoDTO
                {
                    Id = notification.Id, NgayTao = notification.Created, TieuDe = subject, NoiDung = body,
                    LoaiThongBao = LoaiThongBao.DonUngTuyen, ReferenceType = nameof(DonUngTuyen), ReferenceId = application.Id
                }, token);
            }
            catch (Exception ex) { logger.LogWarning(ex, "Không push được thông báo đơn #{Id}", application.Id); }
        });
    }

    private void QueueEmail(int recipient, string subject, string body)
    {
        context.EnqueueAfterSave(async token =>
        {
            try
            {
                var address = await resolver.GetEmailByNguoiDungIdAsync(recipient, token);
                if (!string.IsNullOrWhiteSpace(address)) await email.SendAsync(new EmailRequest
                { To = address, Subject = subject, Body = System.Net.WebUtility.HtmlEncode(body).Replace("\n", "<br />") });
            }
            catch (Exception ex) { logger.LogWarning(ex, "Không gửi được email ứng tuyển cho {UserId}", recipient); }
        });
    }
}
