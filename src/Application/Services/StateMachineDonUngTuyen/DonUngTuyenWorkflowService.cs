using Application.DTOs.Email;
using Application.DTOs.ThongBao;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using DonUngTuyen = Domain.Entities.DonUngTuyen;

namespace Application.Services.StateMachineDonUngTuyen
{
    /// <summary>
    /// 1. Tạo thông báo trong app cho ứng viên sau MỌI transition.
    /// 2. Tạo thông báo trong app cho HR đăng tin với các transition không phải
    ///    do HR thực hiện (đơn mới, gửi lại, sự cố, quá hạn, rút đơn, tin đóng).
    /// 3. Đẩy realtime qua SignalR sau mỗi thông báo được tạo.
    /// 4. Email cho ứng viên khi có kết quả đánh giá (phù hợp / từ chối).
    /// Dự án không làm tới phỏng vấn: không có logic LichPhongVan.
    /// </summary>
    public class DonUngTuyenWorkflowService : IDonUngTuyenWorkflowService
    {
        private readonly IApplicationDbContext _context;
        private readonly IEmailService _email;
        private readonly IUserEmailResolver _emailResolver;
        private readonly INotificationPushService _push;

        // Transition do HR thực hiện — không cần báo lại cho chính HR.
        private static readonly TriggerDonUngTuyen[] TriggerCuaHr =
        {
            TriggerDonUngTuyen.XemDon,
            TriggerDonUngTuyen.DanhGiaPhuHop,
            TriggerDonUngTuyen.TuChoi
        };

        public DonUngTuyenWorkflowService(
            IApplicationDbContext context,
            IEmailService email,
            IUserEmailResolver emailResolver,
            INotificationPushService push)
        {
            _context = context;
            _email = email;
            _emailResolver = emailResolver;
            _push = push;
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
            int UngVienId = entity.CVUngVien?.HoSoUngVien?.NguoiDungId ?? 0;
            string TieuDeTin = entity.TinTuyenDung?.TieuDe ?? "vị trí ứng tuyển";

            // 1) Thông báo trong app cho ứng viên — mọi transition.
            if (UngVienId > 0)
            {
                await ThemThongBaoAsync(
                    UngVienId,
                    LoaiThongBao.DonUngTuyen,
                    TieuDeThongBaoUngVien(trigger),
                    NoiDungThongBao(UngVienId, trigger, note, TieuDeTin, choHr: false),
                    entity,
                    ct);
            }

            // 2) Thông báo trong app cho HR đăng tin — trừ hành động do HR làm.
            if (!TriggerCuaHr.Contains(trigger))
            {
                var tin = await _context.TinTuyenDungs
                    .AsNoTracking()
                    .Where(t => t.Id == entity.TinTuyenDungId)
                    .Select(t => new { t.TieuDe, t.NguoiDangTinId })
                    .FirstOrDefaultAsync(ct);

                if (tin != null)
                {
                    if (!string.IsNullOrWhiteSpace(tin.TieuDe))
                    {
                        TieuDeTin = tin.TieuDe;
                    }

                    if (tin.NguoiDangTinId > 0)
                    {
                        await ThemThongBaoAsync(
                            tin.NguoiDangTinId,
                            LoaiThongBao.DonUngTuyen,
                            TieuDeThongBaoHr(trigger),
                            NoiDungThongBao(UngVienId, trigger, note, TieuDeTin, choHr: true),
                            entity,
                            ct);
                    }
                }
            }

            // 3) Email cho ứng viên khi có kết quả đánh giá (phù hợp / từ chối)
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

        private async Task ThemThongBaoAsync(
            int nguoiDungId,
            LoaiThongBao loai,
            string tieuDe,
            string noiDung,
            DonUngTuyen entity,
            CancellationToken ct)
        {
            _context.Notifications.Add(new Notification
            {
                LoaiThongBao = loai,
                TieuDe = tieuDe,
                NoiDung = noiDung,
                ReferenceType = nameof(DonUngTuyen),
                ReferenceId = entity.Id,
                Recipients = new List<NotificationRecipient>
                {
                    new() { NguoiDungId = nguoiDungId, IsRead = false } // lúc này mới tạo chưa đã đọc
                }
            });

            await _push.PushToUserAsync(
                nguoiDungId,
                new ThongBaoDTO
                {
                    TieuDe = tieuDe,
                    NoiDung = noiDung,
                    LoaiThongBao = loai,
                    ReferenceType = nameof(DonUngTuyen),
                    ReferenceId = entity.Id
                },
                ct);
        }

        private static string TieuDeThongBaoUngVien(TriggerDonUngTuyen t) => t switch
        {
            TriggerDonUngTuyen.XuLyHoSoThanhCong => "Đã nhận hồ sơ ứng tuyển",
            TriggerDonUngTuyen.XuLyHoSoThatBai => "Hồ sơ gặp sự cố kỹ thuật",
            TriggerDonUngTuyen.NopLaiHoSo => "Đã nhận lại hồ sơ",
            TriggerDonUngTuyen.HetHanXuLy => "Đơn ứng tuyển quá hạn xử lý",
            TriggerDonUngTuyen.DongBoiTinTuyenDung => "Tin tuyển dụng đã đóng",
            TriggerDonUngTuyen.XemDon => "Nhà tuyển dụng đã xem hồ sơ",
            TriggerDonUngTuyen.DanhGiaPhuHop => "Hồ sơ của bạn đã được đánh giá phù hợp",
            TriggerDonUngTuyen.TuChoi => "Kết quả ứng tuyển",
            TriggerDonUngTuyen.RutDon => "Đơn ứng tuyển đã rút",
            _ => "Cập nhật đơn ứng tuyển"
        };

        private static string TieuDeThongBaoHr(TriggerDonUngTuyen t) => t switch
        {
            TriggerDonUngTuyen.XuLyHoSoThanhCong => "Đơn ứng tuyển mới",
            TriggerDonUngTuyen.XuLyHoSoThatBai => "Hồ sơ ứng tuyển gặp sự cố",
            TriggerDonUngTuyen.NopLaiHoSo => "Ứng viên gửi lại hồ sơ",
            TriggerDonUngTuyen.HetHanXuLy => "Đơn ứng tuyển quá hạn xử lý",
            TriggerDonUngTuyen.DongBoiTinTuyenDung => "Đơn dừng do tin đã đóng",
            TriggerDonUngTuyen.RutDon => "Ứng viên đã rút đơn",
            _ => "Cập nhật đơn ứng tuyển"
        };

        private static string NoiDungThongBao(int ungVienId, TriggerDonUngTuyen t, string note, string tin, bool choHr)
        {
            var coBan = choHr ? NoiDungThongBaoHr(t, tin) : NoiDungThongBaoUngVien(t, tin);

            if (string.IsNullOrWhiteSpace(note) || note == t.ToString())
            {
                return coBan;
            }

            return $"{coBan}\n\nGhi chú: {note}";
        }

        private static string NoiDungThongBaoUngVien(TriggerDonUngTuyen t, string tin) => t switch
        {
            TriggerDonUngTuyen.XuLyHoSoThanhCong => $"Hồ sơ của bạn cho vị trí {tin} đã được tiếp nhận và đang chờ xử lý.",
            TriggerDonUngTuyen.XuLyHoSoThatBai => $"Hồ sơ nộp cho vị trí {tin} gặp sự cố kỹ thuật. Vui lòng gửi lại hồ sơ.",
            TriggerDonUngTuyen.NopLaiHoSo => $"Hồ sơ gửi lại cho vị trí {tin} đã vào hàng đợi xử lý.",
            TriggerDonUngTuyen.HetHanXuLy => $"Đơn ứng tuyển vị trí {tin} đã quá hạn xử lý.",
            TriggerDonUngTuyen.DongBoiTinTuyenDung => $"Tin {tin} đã ngừng nhận hồ sơ nên đơn của bạn được ghi nhận dừng xử lý.",
            TriggerDonUngTuyen.XemDon => $"Nhà tuyển dụng đã xem hồ sơ ứng tuyển vị trí {tin} của bạn.",
            TriggerDonUngTuyen.DanhGiaPhuHop => $"Hồ sơ của bạn cho vị trí {tin} đã được đánh giá phù hợp.",
            TriggerDonUngTuyen.TuChoi => $"Hồ sơ của bạn cho vị trí {tin} chưa phù hợp.",
            TriggerDonUngTuyen.RutDon => $"Bạn đã rút đơn ứng tuyển vị trí {tin}.",
            _ => $"Đơn ứng tuyển vị trí {tin} có cập nhật."
        };

        private static string NoiDungThongBaoHr(TriggerDonUngTuyen t, string tin) => t switch
        {
            TriggerDonUngTuyen.XuLyHoSoThanhCong => $"Tin {tin} vừa nhận được đơn ứng tuyển mới. Hãy mở xem và xử lý.",
            TriggerDonUngTuyen.XuLyHoSoThatBai => $"Một hồ sơ nộp vào tin {tin} gặp sự cố kỹ thuật.",
            TriggerDonUngTuyen.NopLaiHoSo => $"Ứng viên đã gửi lại hồ sơ vào tin {tin}.",
            TriggerDonUngTuyen.HetHanXuLy => $"Một đơn ứng tuyển vào tin {tin} đã quá hạn xử lý.",
            TriggerDonUngTuyen.DongBoiTinTuyenDung => $"Một đơn ứng tuyển vào tin {tin} đã dừng do tin đóng.",
            TriggerDonUngTuyen.RutDon => $"Ứng viên đã rút đơn ứng tuyển vị trí {tin}.",
            _ => $"Đơn ứng tuyển vào tin {tin} có cập nhật."
        };
    }
}
