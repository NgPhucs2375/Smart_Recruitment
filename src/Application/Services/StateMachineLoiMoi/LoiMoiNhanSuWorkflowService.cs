using Application.DTOs.Email;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using LoiMoiNhanSu = Domain.Entities.LoiMoiNhanSu;

namespace Application.Services.StateMachineLoiMoi
{
    /// <summary>
    /// 1. Tạo thông báo trong app cho Người đại diện sau mỗi transition.
    /// 2. Email cho Người đại diện khi lời mời được chấp nhận / từ chối.
    /// 3. Email cho người được mời khi lời mời bị thu hồi.
    /// Mail mời ban đầu do InviteNhanSuCommand gửi lúc tạo (creation không phải trigger).
    /// Ghi qua _context.Notifications (deferred) để caller commit chung 1 lần.
    /// </summary>
    public class LoiMoiNhanSuWorkflowService : ILoiMoiNhanSuWorkflowService
    {
        private readonly IApplicationDbContext _context;
        private readonly IEmailService _email;
        private readonly IUserEmailResolver _emailResolver;

        public LoiMoiNhanSuWorkflowService(
            IApplicationDbContext context,
            IEmailService email,
            IUserEmailResolver emailResolver)
        {
            _context = context;
            _email = email;
            _emailResolver = emailResolver;
        }

        /// <summary>
        /// Tập hợp các side-effect chạy SAU mỗi transition của <see cref="LoiMoiNhanSuStateMachine"/>.
        /// </summary>
        public async Task HandleSideEffectsAsync(
            LoiMoiNhanSu entity,
            TriggerLoiMoi trigger,
            string note,
            CancellationToken ct = default)
        {
            string tenDn = entity.DoanhNghiep?.TenDoanhNghiep ?? "doanh nghiệp";
            string nguoiDuocMoi = string.IsNullOrWhiteSpace(entity.HoTen)
                ? entity.Email
                : $"{entity.HoTen} ({entity.Email})";

            // 1) Thông báo trong app cho Người đại diện
            if (entity.NguoiDaiDienId > 0)
            {
                _context.Notifications.Add(new Notification
                {
                    LoaiThongBao = LoaiThongBao.LoiMoiNhanSu,
                    TieuDe = TieuDeThongBao(trigger),
                    NoiDung = string.IsNullOrWhiteSpace(note) || note == trigger.ToString()
                        ? NoiDungThongBao(trigger, tenDn, nguoiDuocMoi)
                        : $"{NoiDungThongBao(trigger, tenDn, nguoiDuocMoi)}\n\nGhi chú: {note}",
                    ReferenceType = nameof(LoiMoiNhanSu),
                    ReferenceId = entity.Id,
                    Recipients = new List<NotificationRecipient>
                    {
                        new() { NguoiDungId = entity.NguoiDaiDienId, IsRead = false } // lúc này mới tạo chưa đã đọc
                    }
                });
            }

            // 2) Email cho Người đại diện khi lời mời được chấp nhận / từ chối
            if ((trigger == TriggerLoiMoi.ChapNhan || trigger == TriggerLoiMoi.TuChoi)
                && entity.NguoiDaiDienId > 0)
            {
                var emailNdd = await _emailResolver.GetEmailByNguoiDungIdAsync(entity.NguoiDaiDienId, ct);
                if (!string.IsNullOrWhiteSpace(emailNdd))
                {
                    await _email.SendAsync(new EmailRequest
                    {
                        To = emailNdd,
                        Subject = TieuDeThongBao(trigger),
                        Body = NoiDungThongBao(trigger, tenDn, nguoiDuocMoi)
                    });
                }
            }

            // 3) Email cho người được mời khi lời mời bị thu hồi
            if (trigger == TriggerLoiMoi.HuyLoiMoi && !string.IsNullOrWhiteSpace(entity.Email))
            {
                await _email.SendAsync(new EmailRequest
                {
                    To = entity.Email,
                    Subject = "Lời mời tham gia doanh nghiệp đã bị thu hồi",
                    Body = $"Lời mời bạn tham gia {tenDn} đã bị người đại diện thu hồi."
                });
            }
        }

        private static string TieuDeThongBao(TriggerLoiMoi t) => t switch
        {
            TriggerLoiMoi.ChapNhan => "Nhân sự đã chấp nhận lời mời",
            TriggerLoiMoi.TuChoi => "Nhân sự đã từ chối lời mời",
            TriggerLoiMoi.HuyLoiMoi => "Đã thu hồi lời mời",
            TriggerLoiMoi.DanhDauHetHan => "Lời mời đã hết hạn",
            _ => "Cập nhật lời mời nhân sự"
        };

        private static string NoiDungThongBao(TriggerLoiMoi t, string tenDn, string nguoiDuocMoi) => t switch
        {
            TriggerLoiMoi.ChapNhan => $"{nguoiDuocMoi} đã chấp nhận lời mời tham gia {tenDn}.",
            TriggerLoiMoi.TuChoi => $"{nguoiDuocMoi} đã từ chối lời mời tham gia {tenDn}.",
            TriggerLoiMoi.HuyLoiMoi => $"Bạn đã thu hồi lời mời gửi tới {nguoiDuocMoi} tham gia {tenDn}.",
            TriggerLoiMoi.DanhDauHetHan => $"Lời mời gửi tới {nguoiDuocMoi} tham gia {tenDn} đã hết hạn.",
            _ => $"Lời mời gửi tới {nguoiDuocMoi} có cập nhật mới."
        };
    }
}
