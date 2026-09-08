using Application.DTOs.Email;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using DonUngTuyen = Domain.Entities.DonUngTuyen;

namespace Application.Services.StateMachineDonUngTuyen
{
    /// <summary>
    /// 1. Tạo thông báo trong app cho ứng viên (trừ các bước nội bộ ồn).
    /// 2. Email cho ứng viên khi có kết quả đánh giá (phù hợp / từ chối).
    /// Dự án không làm tới phỏng vấn: không có logic LichPhongVan.
    /// </summary>
    public class DonUngTuyenWorkflowService : IDonUngTuyenWorkflowService
    {
        private readonly IApplicationDbContext _context;
        private readonly IEmailService _email;
        private readonly IUserEmailResolver _emailResolver;

        public DonUngTuyenWorkflowService(
            IApplicationDbContext context,
            IEmailService email,
            IUserEmailResolver emailResolver)
        {
            _context = context;
            _email = email;
            _emailResolver = emailResolver;
        }

        /// <summary>
        /// Tập hợp các side-effect chạy SAU mỗi transition của <see cref="DonUngTuyenStateMachine"/>.
        /// </summary>
        public async Task HandleSideEffectsAsync(
            DonUngTuyen entity,
            TriggerDonUngTuyen trigger,
            string note,
            CancellationToken ct = default)
        {
            int UngVienId = entity.HoSoUngVien?.NguoiDungId ?? 0;
            string TieuDeTin = entity.TinTuyenDung?.TieuDe ?? "vị trí ứng tuyển";

            // 1) Thông báo trong app cho ứng viên
            if (UngVienId > 0 && CanThongBao(trigger))
            {
                _context.Notifications.Add(new Notification
                {
                    LoaiThongBao = LoaiThongBao.DonUngTuyen,
                    TieuDe = TieuDeThongBao(trigger),
                    NoiDung = string.IsNullOrWhiteSpace(note) || note == trigger.ToString()
                        ? NoiDungThongBao(trigger, TieuDeTin)
                        : $"{NoiDungThongBao(trigger, TieuDeTin)}\n\nGhi chú: {note}",
                    ReferenceType = nameof(DonUngTuyen),
                    ReferenceId = entity.Id,
                    Recipients = new List<NotificationRecipient>
                    {
                        new() { NguoiDungId = UngVienId, IsRead = false } // lúc này mới tạo chưa đã đọc
                    }
                });
            }

            // 2) Email cho ứng viên khi có kết quả đánh giá (phù hợp / từ chối)
            if ((trigger == TriggerDonUngTuyen.DanhGiaPhuHop
                 || trigger == TriggerDonUngTuyen.TuChoi) && UngVienId > 0)
            {
                var emailUv = await _emailResolver.GetEmailByNguoiDungIdAsync(UngVienId, ct);
                if (!string.IsNullOrWhiteSpace(emailUv))
                {
                    bool phuHop = trigger == TriggerDonUngTuyen.DanhGiaPhuHop;
                    await _email.SendAsync(new EmailRequest
                    {
                        To = emailUv,
                        Subject = phuHop ? "Hồ sơ của bạn đã được đánh giá phù hợp" : "Kết quả ứng tuyển",
                        Body = phuHop
                            ? $"Hồ sơ của bạn cho vị trí {TieuDeTin} đã được đánh giá phù hợp. Nhà tuyển dụng sẽ liên hệ với bạn."
                            : $"Rất tiếc hồ sơ của bạn cho vị trí {TieuDeTin} chưa phù hợp đợt này."
                    });
                }
            }
        }

        // Các bước nội bộ ồn (tiếp nhận xong, HR mới mở xem) thì không thông báo
        private static bool CanThongBao(TriggerDonUngTuyen t)
            => t != TriggerDonUngTuyen.XuLyHoSoThanhCong
            && t != TriggerDonUngTuyen.XemDon;

        private static string TieuDeThongBao(TriggerDonUngTuyen t) => t switch
        {
            TriggerDonUngTuyen.XuLyHoSoThatBai => "Hồ sơ gặp sự cố kỹ thuật",
            TriggerDonUngTuyen.NopLaiHoSo => "Đã nhận lại hồ sơ",
            TriggerDonUngTuyen.HetHanXuLy => "Đơn ứng tuyển quá hạn xử lý",
            TriggerDonUngTuyen.DongBoiTinTuyenDung => "Tin tuyển dụng đã đóng",
            TriggerDonUngTuyen.DanhGiaPhuHop => "Hồ sơ của bạn đã được đánh giá phù hợp",
            TriggerDonUngTuyen.TuChoi => "Kết quả ứng tuyển",
            TriggerDonUngTuyen.RutDon => "Đơn ứng tuyển đã rút",
            _ => "Cập nhật đơn ứng tuyển"
        };

        private static string NoiDungThongBao(TriggerDonUngTuyen t, string tin) => t switch
        {
            TriggerDonUngTuyen.XuLyHoSoThatBai => $"Hồ sơ nộp cho vị trí {tin} gặp sự cố kỹ thuật. Vui lòng gửi lại hồ sơ.",
            TriggerDonUngTuyen.NopLaiHoSo => $"Hồ sơ gửi lại cho vị trí {tin} đã vào hàng đợi xử lý.",
            TriggerDonUngTuyen.HetHanXuLy => $"Đơn ứng tuyển vị trí {tin} đã quá hạn xử lý.",
            TriggerDonUngTuyen.DongBoiTinTuyenDung => $"Tin {tin} đã ngừng nhận hồ sơ nên đơn của bạn được ghi nhận dừng xử lý.",
            TriggerDonUngTuyen.DanhGiaPhuHop => $"Hồ sơ của bạn cho vị trí {tin} đã được đánh giá phù hợp.",
            TriggerDonUngTuyen.TuChoi => $"Hồ sơ của bạn cho vị trí {tin} chưa phù hợp.",
            TriggerDonUngTuyen.RutDon => $"Bạn đã rút đơn ứng tuyển vị trí {tin}.",
            _ => $"Đơn ứng tuyển vị trí {tin} có cập nhật."
        };
    }
}
