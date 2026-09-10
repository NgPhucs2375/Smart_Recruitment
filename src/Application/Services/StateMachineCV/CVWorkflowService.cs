using Application.DTOs.Email;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using CVUngVien = Domain.Entities.CVUngVien;

namespace Application.Services.StateMachineCV
{
    /// <summary>
    /// 1. Tạo thông báo trong app cho ứng viên (trừ các bước trung gian ồn).
    /// 2. Email cho ứng viên khi CV lỗi cần xử lý hoặc đã sẵn sàng để nộp.
    /// 3. Quản lý cờ IsDefault khi CV sang SanSang / VoHieuHoa.
    /// </summary>
    public class CVWorkflowService : ICVWorkflowService
    {
        private readonly IApplicationDbContext _context;
        private readonly IEmailService _email;
        private readonly IUserEmailResolver _emailResolver;

        public CVWorkflowService(
            IApplicationDbContext context,
            IEmailService email,
            IUserEmailResolver emailResolver)
        {
            _context = context;
            _email = email;
            _emailResolver = emailResolver;
        }

        /// <summary>
        /// Tập hợp các side-effect chạy SAU mỗi transition của <see cref="CVStateMachine"/>.
        /// </summary>
        public async Task HandleSideEffectsAsync(
            CVUngVien entity,
            TriggerCVUngVien trigger,
            string note,
            CancellationToken ct = default)
        {
            int ungVienId = entity.HoSoUngVien?.NguoiDungId ?? 0;
            string tenFile = string.IsNullOrWhiteSpace(entity.TenFile) ? $"CV #{entity.Id}" : entity.TenFile;

            // 1) Thông báo trong app cho ứng viên
            if (ungVienId > 0 && CanThongBao(trigger))
            {
                _context.Notifications.Add(new Notification
                {
                    LoaiThongBao = LoaiThongBao.CVUngVien,
                    TieuDe = TieuDeThongBao(trigger),
                    NoiDung = string.IsNullOrWhiteSpace(note) || note == trigger.ToString()
                        ? NoiDungThongBao(trigger, tenFile)
                        : $"{NoiDungThongBao(trigger, tenFile)}\n\nGhi chú: {note}",
                    ReferenceType = nameof(CVUngVien),
                    ReferenceId = entity.Id,
                    Recipients = new List<NotificationRecipient>
                    {
                        new() { NguoiDungId = ungVienId, IsRead = false } // lúc này mới tạo chưa đã đọc
                    }
                });
            }

            // 2) Email cho ứng viên khi CV lỗi hoặc đã sẵn sàng
            if (CanGuiEmail(trigger) && ungVienId > 0)
            {
                var emailUv = await _emailResolver.GetEmailByNguoiDungIdAsync(ungVienId, ct);
                if (!string.IsNullOrWhiteSpace(emailUv))
                {
                    bool biLoi = trigger == TriggerCVUngVien.TaiLenThatBai
                        || trigger == TriggerCVUngVien.ModelGenThatBai;
                    await _email.SendAsync(new EmailRequest
                    {
                        To = emailUv,
                        Subject = biLoi ? "CV của bạn gặp sự cố" : "CV của bạn đã sẵn sàng",
                        Body = biLoi
                            ? $"Quá trình xử lý {tenFile} gặp sự cố: {entity.LoiChiTiet}. Vui lòng thử lại."
                            : $"{tenFile} đã sẵn sàng để nộp vào tin tuyển dụng."
                    });
                }
            }

            // 3a) CV vừa SanSang mà là default -> hạ các CV default khác cùng hồ sơ
            if (entity.TrangThaiCV == TrangThaiCV.SanSang && entity.IsDefault)
            {
                var others = await _context.CVUngViens
                    .Where(x => x.HoSoUngVienId == entity.HoSoUngVienId
                        && x.Id != entity.Id
                        && x.IsDefault)
                    .ToListAsync(ct);
                foreach (var o in others) o.IsDefault = false;
            }

            // 3b) CV default bị vô hiệu hóa -> đôn CV SanSang mới nhất khác lên default
            if (trigger == TriggerCVUngVien.VoHieuHoa && entity.IsDefault)
            {
                entity.IsDefault = false;
                var replacement = await _context.CVUngViens
                    .Where(x => x.HoSoUngVienId == entity.HoSoUngVienId
                        && x.Id != entity.Id
                        && x.TrangThaiCV == TrangThaiCV.SanSang)
                    .OrderByDescending(x => x.NgayUpload)
                    .FirstOrDefaultAsync(ct);
                if (replacement != null) replacement.IsDefault = true;
            }
        }

        // Các bước trung gian ồn (khởi tạo / lưu nháp / upload xong chờ kiểm tra) thì không thông báo
        private static bool CanThongBao(TriggerCVUngVien t)
            => t != TriggerCVUngVien.BatDauTao
            && t != TriggerCVUngVien.LuuNhapThuCong
            && t != TriggerCVUngVien.TaiLenThanhCong;

        // Chỉ gửi email ở 2 mốc quan trọng: lỗi cần xử lý và sẵn sàng để nộp
        private static bool CanGuiEmail(TriggerCVUngVien t)
            => t == TriggerCVUngVien.TaiLenThatBai
            || t == TriggerCVUngVien.ModelGenThatBai
            || t == TriggerCVUngVien.HoanTatThuCong
            || t == TriggerCVUngVien.KiemTraHopLe
            || t == TriggerCVUngVien.UngVienDuyetAI;

        private static string TieuDeThongBao(TriggerCVUngVien t) => t switch
        {
            TriggerCVUngVien.HoanTatThuCong => "CV của bạn đã sẵn sàng",
            TriggerCVUngVien.KiemTraHopLe => "CV tải lên đã hợp lệ",
            TriggerCVUngVien.UngVienDuyetAI => "CV do AI tạo đã sẵn sàng",
            TriggerCVUngVien.TaiLenThatBai => "Tải CV lên thất bại",
            TriggerCVUngVien.ModelGenThatBai => "Tạo CV bằng AI thất bại",
            TriggerCVUngVien.ModelGenThanhCong => "AI đã tạo xong CV, mời bạn kiểm tra",
            TriggerCVUngVien.ThuLaiSauLoi => "Đang thử lại xử lý CV",
            TriggerCVUngVien.YeuCauGenLaiAI => "AI đang tạo lại CV theo yêu cầu",
            TriggerCVUngVien.ChinhSuaLai => "CV đang được chỉnh sửa",
            TriggerCVUngVien.VoHieuHoa => "CV đã bị vô hiệu hóa",
            TriggerCVUngVien.KhoiPhuc => "CV đã được khôi phục",
            _ => "Cập nhật CV"
        };

        private static string NoiDungThongBao(TriggerCVUngVien t, string tenFile) => t switch
        {
            TriggerCVUngVien.HoanTatThuCong => $"{tenFile} đã hoàn tất và sẵn sàng để nộp vào tin tuyển dụng.",
            TriggerCVUngVien.KiemTraHopLe => $"{tenFile} đã vượt qua kiểm tra định dạng và sẵn sàng để nộp.",
            TriggerCVUngVien.UngVienDuyetAI => $"{tenFile} do AI tạo đã được duyệt và sẵn sàng để nộp.",
            TriggerCVUngVien.TaiLenThatBai => $"Quá trình tải lên {tenFile} thất bại. Vui lòng kiểm tra định dạng file và thử lại.",
            TriggerCVUngVien.ModelGenThatBai => $"Quá trình sinh {tenFile} bằng AI thất bại. Vui lòng thử lại.",
            TriggerCVUngVien.ModelGenThanhCong => $"AI đã tạo xong {tenFile}. Vui lòng kiểm tra lại và bấm duyệt.",
            TriggerCVUngVien.ThuLaiSauLoi => $"Hệ thống đang thử lại xử lý {tenFile}.",
            TriggerCVUngVien.YeuCauGenLaiAI => $"AI đang tạo lại {tenFile} theo yêu cầu của bạn.",
            TriggerCVUngVien.ChinhSuaLai => $"{tenFile} đang được mở để chỉnh sửa, tạm thời chưa dùng để nộp đơn.",
            TriggerCVUngVien.VoHieuHoa => $"{tenFile} đã bị vô hiệu hóa và không còn dùng để nộp đơn.",
            TriggerCVUngVien.KhoiPhuc => $"{tenFile} đã được khôi phục và sẵn sàng để nộp.",
            _ => $"{tenFile} có cập nhật mới."
        };
    }
}
