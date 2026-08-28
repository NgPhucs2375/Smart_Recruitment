using Application.DTOs.Email;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using DonUngTuyen = Domain.Entities.DonUngTuyen;
using LichPhongVan = Domain.Entities.LichPhongVan;
using ThongBao = Domain.Entities.ThongBao;

namespace Application.Services.StateMachineDonUngTuyen
{
    /// <summary>
    /// 1. Tạo thông báo cho ứng viên 
    /// 2. Email cho ứng viên khi có kết quả (trúng tuyển / từ chối)
    /// 3. Tạo lịch phỏng vấn (trạng thái Chờ xác nhận) khi HR hẹn lịch
    /// 4. Hủy lịch phỏng vấn tùy trường hợp khi ứng viên rút đơn ở bước đã có lịch
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
        /// Tập hợp các side-effect chạy SAU mỗi transition của DonUngTuyenStateMachine.
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
                _context.ThongBaos.Add(new ThongBao
                {
                    NguoiDungId = UngVienId,
                    LoaiThongBao = LoaiThongBao.DonUngTuyen,
                    TieuDe = TieuDeThongBao(trigger),
                    NoiDung = string.IsNullOrWhiteSpace(note)
                        ? NoiDungThongBao(trigger, TieuDeTin)
                        : $"{NoiDungThongBao(trigger, TieuDeTin)}\n\nGhi chú: {note}",
                    IsRead = false // lúc này mới tạo chưa đã đọc 
                });
            }

            // 2) Email cho ứng viên khi có kết quả (trúng tuyển / từ chối)
            if ((trigger == TriggerDonUngTuyen.CongBoTrungTuyen
                 || trigger == TriggerDonUngTuyen.TuChoi) && UngVienId > 0)
            {
                var emailUv = await _emailResolver.GetEmailByNguoiDungIdAsync(UngVienId, ct);
                if (!string.IsNullOrWhiteSpace(emailUv))
                {
                    bool trungTuyen = trigger == TriggerDonUngTuyen.CongBoTrungTuyen;
                    await _email.SendAsync(new EmailRequest
                    {
                        To = emailUv,
                        Subject = trungTuyen ? "Chúc mừng bạn trúng tuyển" : "Kết quả ứng tuyển",
                        Body = trungTuyen
                            ? $"Chúc mừng bạn đã trúng tuyển vị trí {TieuDeTin}."
                            : $"Rất tiếc hồ sơ của bạn cho vị trí {TieuDeTin} chưa phù hợp đợt này."
                    });
                }
            }

            // 3) Tạo lịch phỏng vấn (trạng thái Chờ xác nhận) khi HR hẹn lịch
            if (trigger == TriggerDonUngTuyen.TaoLichPhongVan)
            {
                _context.LichPhongVans.Add(new LichPhongVan
                {
                    DonUngTuyenId = entity.Id,
                    HinhThuc = HinhThucPhongVan.Online,
                    TrangThai = TrangThaiLichPhongVan.ChoXacNhan
                });
            }

            // 4) Hủy lịch phỏng vấn liên đới khi ứng viên rút đơn ở bước đã có lịch
            if (trigger == TriggerDonUngTuyen.RutDonSauPhongVan)
            {
                var lichActive = await _context.LichPhongVans
                    .Where(l => l.DonUngTuyenId == entity.Id
                                && l.TrangThai != TrangThaiLichPhongVan.DaHuy)
                    .ToListAsync(ct);
                foreach (var l in lichActive)
                    l.TrangThai = TrangThaiLichPhongVan.DaHuy;
            }
        }

        // Hepler cho việc xác định xem trigger có cần thông báo hay không
        private static bool CanThongBao(TriggerDonUngTuyen t) => t != TriggerDonUngTuyen.XemDon;

        private static string TieuDeThongBao(TriggerDonUngTuyen t) => t switch
        {
            TriggerDonUngTuyen.DanhGiaPhuHop => "Hồ sơ của bạn đã được đánh giá phù hợp",
            TriggerDonUngTuyen.TaoLichPhongVan => "Bạn được mời phỏng vấn",
            TriggerDonUngTuyen.CongBoTrungTuyen => "Chúc mừng bạn trúng tuyển",
            TriggerDonUngTuyen.TuChoi => "Kết quả ứng tuyển",
            TriggerDonUngTuyen.RutDonTruocPhongVan => "Đơn ứng tuyển đã rút",
            TriggerDonUngTuyen.RutDonSauPhongVan => "Đơn ứng tuyển đã rút (hủy lịch PV)",
            _ => "Cập nhật đơn ứng tuyển"
        };

        private static string NoiDungThongBao(TriggerDonUngTuyen t, string tin) => t switch
        {
            TriggerDonUngTuyen.DanhGiaPhuHop => $"Hồ sơ của bạn cho vị trí {tin} đã được đánh giá phù hợp.",
            TriggerDonUngTuyen.TaoLichPhongVan => $"Nhà tuyển dụng mời bạn phỏng vấn vị trí {tin}.",
            TriggerDonUngTuyen.CongBoTrungTuyen => $"Bạn đã trúng tuyển vị trí {tin}.",
            TriggerDonUngTuyen.TuChoi => $"Hồ sơ của bạn cho vị trí {tin} chưa phù hợp.",
            TriggerDonUngTuyen.RutDonTruocPhongVan => $"Bạn đã rút đơn ứng tuyển vị trí {tin}.",
            TriggerDonUngTuyen.RutDonSauPhongVan => $"Bạn đã rút đơn ứng tuyển vị trí {tin}, lịch phỏng vấn đã hủy.",
            _ => $"Đơn ứng tuyển vị trí {tin} có cập nhật."
        };
    }
}
