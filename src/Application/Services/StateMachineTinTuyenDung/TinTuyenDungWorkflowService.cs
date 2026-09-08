using Application.DTOs.Email;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Services.StateMachineTinTuyenDung
{
    /// <summary>
    /// 1. Tạo thông báo cho HR đăng tin sau mỗi transition.
    /// 2. Email cho HR khi có kết quả kiểm duyệt / tin bị khóa.
    /// 3. Cascade trực tiếp: tin Dong/HetHan/BiKhoa -&gt; các đơn đang dở dang sang TinTuyenDungBiDong
    ///    kèm thông báo cho từng ứng viên (không qua DonUngTuyenStateMachine để tránh vòng phụ thuộc).
    /// </summary>
    public class TinTuyenDungWorkflowService : ITinTuyenDungWorkflowService
    {
        private readonly IApplicationDbContext _context;
        private readonly IEmailService _email;
        private readonly IUserEmailResolver _emailResolver;

        // Các đơn "đang dở dang" cần cascade khi tin đóng/hết hạn/bị khóa
        private static readonly TrangThaiDonUngTuyen[] DonDangDo =
        {
            TrangThaiDonUngTuyen.ChoXuLy,
            TrangThaiDonUngTuyen.DaXem,
            TrangThaiDonUngTuyen.PhuHop
        };

        public TinTuyenDungWorkflowService(
            IApplicationDbContext context,
            IEmailService email,
            IUserEmailResolver emailResolver)
        {
            _context = context;
            _email = email;
            _emailResolver = emailResolver;
        }

        /// <summary>
        /// Tập hợp các side-effect chạy SAU mỗi transition của <see cref="TinTuyenDungStateMachine"/>.
        /// </summary>
        public async Task HandleSideEffectsAsync(
            TinTuyenDung entity,
            TriggerTinTuyenDung trigger,
            string note,
            CancellationToken ct = default)
        {
            string tieuDe = string.IsNullOrWhiteSpace(entity.TieuDe) ? $"Tin #{entity.Id}" : entity.TieuDe;

            // 1) Thông báo trong app cho HR đăng tin
            if (entity.NguoiDangTinId > 0)
            {
                _context.Notifications.Add(new Notification
                {
                    LoaiThongBao = LoaiThongBao.ViecLamMoi,
                    TieuDe = TieuDeThongBao(trigger),
                    NoiDung = string.IsNullOrWhiteSpace(note) || note == trigger.ToString()
                        ? NoiDungThongBao(trigger, tieuDe)
                        : $"{NoiDungThongBao(trigger, tieuDe)}\n\nGhi chú: {note}",
                    ReferenceType = nameof(TinTuyenDung),
                    ReferenceId = entity.Id,
                    Recipients = new List<NotificationRecipient>
                    {
                        new() { NguoiDungId = entity.NguoiDangTinId, IsRead = false } // lúc này mới tạo chưa đã đọc
                    }
                });
            }

            // 2) Email cho HR khi có kết quả kiểm duyệt / tin bị khóa
            if (CanGuiEmail(trigger) && entity.NguoiDangTinId > 0)
            {
                var emailHr = await _emailResolver.GetEmailByNguoiDungIdAsync(entity.NguoiDangTinId, ct);
                if (!string.IsNullOrWhiteSpace(emailHr))
                {
                    await _email.SendAsync(new EmailRequest
                    {
                        To = emailHr,
                        Subject = TieuDeThongBao(trigger),
                        Body = NoiDungThongBao(trigger, tieuDe)
                    });
                }
            }

            // 3) Cascade: tin không còn nhận hồ sơ -> đóng các đơn đang dở dang
            if (trigger == TriggerTinTuyenDung.DongTin
                || trigger == TriggerTinTuyenDung.HetHanNop
                || trigger == TriggerTinTuyenDung.AdminCuongCheKhoa)
            {
                var dons = await _context.DonUngTuyens
                    .Include(d => d.HoSoUngVien)
                    .Where(d => d.TinTuyenDungId == entity.Id && DonDangDo.Contains(d.TrangThai))
                    .ToListAsync(ct);

                foreach (var don in dons)
                {
                    don.TrangThai = TrangThaiDonUngTuyen.TinTuyenDungBiDong;
                    don.GhiChu = $"Tin tuyển dụng đã {LyDoDongTin(trigger)}.";

                    int ungVienId = don.HoSoUngVien?.NguoiDungId ?? 0;
                    if (ungVienId > 0)
                    {
                        _context.Notifications.Add(new Notification
                        {
                            LoaiThongBao = LoaiThongBao.DonUngTuyen,
                            TieuDe = "Tin tuyển dụng bạn đã ứng tuyển đã đóng",
                            NoiDung = $"Tin {tieuDe} đã {LyDoDongTin(trigger)} nên đơn ứng tuyển của bạn được ghi nhận dừng xử lý.",
                            ReferenceType = nameof(DonUngTuyen),
                            ReferenceId = don.Id,
                            Recipients = new List<NotificationRecipient>
                            {
                                new() { NguoiDungId = ungVienId, IsRead = false }
                            }
                        });
                    }
                }
            }
        }

        // Chỉ gửi email ở mốc kết quả kiểm duyệt / khóa tin
        private static bool CanGuiEmail(TriggerTinTuyenDung t)
            => t == TriggerTinTuyenDung.HeThongTuDongDuyet
            || t == TriggerTinTuyenDung.HeThongTuChoi
            || t == TriggerTinTuyenDung.AdminDuyet
            || t == TriggerTinTuyenDung.AdminTuChoi
            || t == TriggerTinTuyenDung.AdminCuongCheKhoa;

        private static string LyDoDongTin(TriggerTinTuyenDung t) => t switch
        {
            TriggerTinTuyenDung.DongTin => "được nhà tuyển dụng đóng",
            TriggerTinTuyenDung.HetHanNop => "hết hạn nhận hồ sơ",
            TriggerTinTuyenDung.AdminCuongCheKhoa => "bị quản trị viên gỡ do vi phạm",
            _ => "ngừng nhận hồ sơ"
        };

        private static string TieuDeThongBao(TriggerTinTuyenDung t) => t switch
        {
            TriggerTinTuyenDung.GuiDuyet => "Tin đã gửi kiểm duyệt",
            TriggerTinTuyenDung.HeThongTuDongDuyet => "Tin đã được duyệt tự động",
            TriggerTinTuyenDung.PhatHienNghiVan => "Tin cần Admin kiểm tra",
            TriggerTinTuyenDung.HeThongTuChoi => "Tin bị hệ thống từ chối",
            TriggerTinTuyenDung.AdminDuyet => "Tin đã được Admin duyệt",
            TriggerTinTuyenDung.AdminTuChoi => "Tin bị Admin từ chối",
            TriggerTinTuyenDung.TamDungTin => "Tin đã tạm dừng",
            TriggerTinTuyenDung.MoLaiTin => "Tin đã mở lại",
            TriggerTinTuyenDung.HetHanNop => "Tin đã hết hạn",
            TriggerTinTuyenDung.DongTin => "Tin đã đóng",
            TriggerTinTuyenDung.AdminCuongCheKhoa => "Tin bị khóa do vi phạm",
            _ => "Cập nhật tin tuyển dụng"
        };

        private static string NoiDungThongBao(TriggerTinTuyenDung t, string tieuDe) => t switch
        {
            TriggerTinTuyenDung.GuiDuyet => $"Tin {tieuDe} đã gửi vào funnel kiểm duyệt hệ thống.",
            TriggerTinTuyenDung.HeThongTuDongDuyet => $"Tin {tieuDe} đã pass kiểm duyệt tự động và đang công khai.",
            TriggerTinTuyenDung.PhatHienNghiVan => $"Tin {tieuDe} rơi vào vùng nghi vấn, đã chuyển Admin kiểm tra.",
            TriggerTinTuyenDung.HeThongTuChoi => $"Tin {tieuDe} bị hệ thống từ chối (vi phạm luật kiểm duyệt). Vui lòng chỉnh sửa và gửi lại.",
            TriggerTinTuyenDung.AdminDuyet => $"Tin {tieuDe} đã được Admin duyệt và đang công khai.",
            TriggerTinTuyenDung.AdminTuChoi => $"Tin {tieuDe} bị Admin từ chối. Vui lòng chỉnh sửa và gửi duyệt lại.",
            TriggerTinTuyenDung.TamDungTin => $"Tin {tieuDe} đã tạm dừng nhận hồ sơ.",
            TriggerTinTuyenDung.MoLaiTin => $"Tin {tieuDe} đã mở lại và tiếp tục nhận hồ sơ.",
            TriggerTinTuyenDung.HetHanNop => $"Tin {tieuDe} đã hết hạn nhận hồ sơ.",
            TriggerTinTuyenDung.DongTin => $"Tin {tieuDe} đã đóng.",
            TriggerTinTuyenDung.AdminCuongCheKhoa => $"Tin {tieuDe} bị quản trị viên gỡ do vi phạm.",
            _ => $"Tin {tieuDe} có cập nhật mới."
        };
    }
}
