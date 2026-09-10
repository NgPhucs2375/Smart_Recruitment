using Application.DTOs.Email;
using Application.DTOs.ThongBao;
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
    /// 1. Tạo thông báo cho HR đăng tin sau mỗi transition + đẩy realtime.
    /// 2. Báo thêm cho Người đại diện khi tin dính kiểm duyệt/vi phạm.
    /// 3. Email cho HR khi có kết quả kiểm duyệt / tin bị khóa.
    /// 4. Cascade trực tiếp: tin Dong/HetHan/BiKhoa -&gt; các đơn đang dở dang sang TinTuyenDungBiDong
    ///    kèm thông báo cho từng ứng viên (không qua DonUngTuyenStateMachine để tránh vòng phụ thuộc).
    /// </summary>
    public class TinTuyenDungWorkflowService : ITinTuyenDungWorkflowService
    {
        private readonly IApplicationDbContext _context;
        private readonly IEmailService _email;
        private readonly IUserEmailResolver _emailResolver;
        private readonly INotificationPushService _push;

        // Các đơn "đang dở dang" cần cascade khi tin đóng/hết hạn/bị khóa
        private static readonly TrangThaiDonUngTuyen[] DonDangDo =
        {
            TrangThaiDonUngTuyen.ChoXuLy,
            TrangThaiDonUngTuyen.DaXem,
            TrangThaiDonUngTuyen.PhuHop
        };

        // Trigger liên quan kiểm duyệt/vi phạm — cần báo thêm Người đại diện.
        private static readonly TriggerTinTuyenDung[] TriggerBaoChuDoanhNghiep =
        {
            TriggerTinTuyenDung.PhatHienNghiVan,
            TriggerTinTuyenDung.HeThongTuChoi,
            TriggerTinTuyenDung.AdminTuChoi,
            TriggerTinTuyenDung.AdminCuongCheKhoa
        };

        public TinTuyenDungWorkflowService(
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
        /// Tập hợp các side-effect chạy SAU mỗi transition của <see cref="TinTuyenDungStateMachine"/>.
        /// </summary>
        public async Task HandleSideEffectsAsync(
            TinTuyenDung entity,
            TriggerTinTuyenDung trigger,
            string note,
            CancellationToken ct = default)
        {
            string tieuDe = string.IsNullOrWhiteSpace(entity.TieuDe) ? $"Tin #{entity.Id}" : entity.TieuDe;

            var noiDung = string.IsNullOrWhiteSpace(note) || note == trigger.ToString()
                ? NoiDungThongBao(trigger, tieuDe)
                : $"{NoiDungThongBao(trigger, tieuDe)}\n\nGhi chú: {note}";

            // 1) Thông báo trong app cho HR đăng tin + đẩy realtime.
            if (entity.NguoiDangTinId > 0)
            {
                await ThemThongBaoAsync(
                    entity.NguoiDangTinId,
                    LoaiThongBao.ViecLamMoi,
                    TieuDeThongBao(trigger),
                    noiDung,
                    nameof(TinTuyenDung),
                    entity.Id,
                    ct);
            }

            // 1b) Báo thêm Người đại diện khi tin dính kiểm duyệt/vi phạm.
            if (TriggerBaoChuDoanhNghiep.Contains(trigger))
            {
                var chuDoanhNghiepId = await _context.DoanhNghieps
                    .AsNoTracking()
                    .Where(d => d.Id == entity.DoanhNghiepId)
                    .Select(d => d.NguoiDaiDienId)
                    .FirstOrDefaultAsync(ct);

                if (chuDoanhNghiepId.HasValue
                    && chuDoanhNghiepId.Value > 0
                    && chuDoanhNghiepId.Value != entity.NguoiDangTinId)
                {
                    await ThemThongBaoAsync(
                        chuDoanhNghiepId.Value,
                        LoaiThongBao.ViecLamMoi,
                        TieuDeThongBao(trigger),
                        noiDung,
                        nameof(TinTuyenDung),
                        entity.Id,
                        ct);
                }
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
                    .Include(d => d.CVUngVien).ThenInclude(cv => cv.HoSoUngVien)
                    .Where(d => d.TinTuyenDungId == entity.Id && DonDangDo.Contains(d.TrangThai))
                    .ToListAsync(ct);

                foreach (var don in dons)
                {
                    don.TrangThai = TrangThaiDonUngTuyen.TinTuyenDungBiDong;
                    don.GhiChu = $"Tin tuyển dụng đã {LyDoDongTin(trigger)}.";

                    int ungVienId = don.CVUngVien?.HoSoUngVien?.NguoiDungId ?? 0;
                    if (ungVienId > 0)
                    {
                        var tieuDeCascade = "Tin tuyển dụng bạn đã ứng tuyển đã đóng";
                        var noiDungCascade = $"Tin {tieuDe} đã {LyDoDongTin(trigger)} nên đơn ứng tuyển của bạn được ghi nhận dừng xử lý.";

                        _context.Notifications.Add(new Notification
                        {
                            LoaiThongBao = LoaiThongBao.DonUngTuyen,
                            TieuDe = tieuDeCascade,
                            NoiDung = noiDungCascade,
                            ReferenceType = nameof(DonUngTuyen),
                            ReferenceId = don.Id,
                            Recipients = new List<NotificationRecipient>
                            {
                                new() { NguoiDungId = ungVienId, IsRead = false }
                            }
                        });

                        await _push.PushToUserAsync(
                            ungVienId,
                            new ThongBaoDTO
                            {
                                TieuDe = tieuDeCascade,
                                NoiDung = noiDungCascade,
                                LoaiThongBao = LoaiThongBao.DonUngTuyen,
                                ReferenceType = nameof(DonUngTuyen),
                                ReferenceId = don.Id
                            },
                            ct);
                    }
                }
            }
        }

        private async Task ThemThongBaoAsync(
            int nguoiDungId,
            LoaiThongBao loai,
            string tieuDe,
            string noiDung,
            string referenceType,
            int referenceId,
            CancellationToken ct)
        {
            _context.Notifications.Add(new Notification
            {
                LoaiThongBao = loai,
                TieuDe = tieuDe,
                NoiDung = noiDung,
                ReferenceType = referenceType,
                ReferenceId = referenceId,
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
                    ReferenceType = referenceType,
                    ReferenceId = referenceId
                },
                ct);
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
