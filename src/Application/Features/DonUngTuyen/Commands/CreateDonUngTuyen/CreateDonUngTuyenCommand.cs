using Application.Interfaces;
using Application.Services.StateMachineDonUngTuyen;
using Application.Wrappers;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using DonUngTuyenEntity = global::Domain.Entities.DonUngTuyen;
using CVUngVienEntity = global::Domain.Entities.CVUngVien;

namespace Application.Features.DonUngTuyen.Commands.CreateDonUngTuyen;

public class CreateDonUngTuyenCommand : IRequest<Response<int>>
{
    public int HoSoUngVienId { get; set; }
    public int TinTuyenDungId { get; set; }
    public int CVUngVienId { get; set; }
}

public class CreateDonUngTuyenCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current,
    IDonUngTuyenWorkflowService workflow)
    : IRequestHandler<CreateDonUngTuyenCommand, Response<int>>
{
    public async Task<Response<int>> Handle(CreateDonUngTuyenCommand request, CancellationToken cancellationToken)
    {
        var cv = await context.CVUngViens
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.CVUngVienId, cancellationToken);
        if (cv == null) return new Response<int>("CV không tồn tại.");

        var job = await context.TinTuyenDungs
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.TinTuyenDungId, cancellationToken);
        if (job == null) return new Response<int>("Tin tuyển dụng không tồn tại.");

        if (!await context.HoSoUngViens.AnyAsync(x => x.Id == request.HoSoUngVienId, cancellationToken))
        {
            return new Response<int>("Hồ sơ ứng viên không tồn tại.");
        }

        if (cv.HoSoUngVienId != request.HoSoUngVienId)
        {
            return new Response<int>("CV không thuộc về ứng viên.");
        }

        // Gate CV theo state machine 3 cấp: chỉ SanSang (+ HoanTatTienTrinh) mới được nộp.
        var cvError = ValidateCVSanSangNop(cv);
        if (cvError != null) return new Response<int>(cvError);

        if (job.TrangThai != TrangThaiTinTuyenDung.DangTuyen)
        {
            return new Response<int>("Tin tuyển dụng không còn nhận hồ sơ.");
        }

        if (await context.DonUngTuyens.AnyAsync(x => x.HoSoUngVienId == request.HoSoUngVienId && x.TinTuyenDungId == request.TinTuyenDungId, cancellationToken))
        {
            return new Response<int>("Ứng viên đã nộp đơn cho tin này.");
        }

        var entity = new DonUngTuyenEntity
        {
            HoSoUngVienId = request.HoSoUngVienId,
            TinTuyenDungId = request.TinTuyenDungId,
            CVUngVienId = request.CVUngVienId,
            // State machine: đơn mới bắt đầu ở KhoiTao, CV đã pass gate SanSang ở trên
            // nên tiếp nhận hệ thống cho vào hàng đợi ChoXuLy ngay.
            TrangThai = TrangThaiDonUngTuyen.KhoiTao,
            NgayUngTuyen = DateTime.UtcNow
        };

        await context.DonUngTuyens.AddAsync(entity, cancellationToken);

        var machine = new DonUngTuyenStateMachine(workflow, current, entity);
        await machine.FireSystemAsync(
            TriggerDonUngTuyen.XuLyHoSoThanhCong,
            "Hồ sơ hợp lệ, vào hàng đợi xử lý.",
            cancellationToken);

        await context.SaveChangesAsync(cancellationToken);

        return new Response<int>(data: entity.Id, message: "Nộp đơn ứng tuyển thành công.");
    }

    /// <summary>
    /// Gate nộp đơn theo state machine CV 3 cấp.
    /// Cấp 3 (TrangThaiCV) quyết định; cấp 2 (TrangThaiTienTrinhCV) dùng để báo lỗi chi tiết
    /// và kiểm tra nhất quán (SanSang bắt buộc đi kèm HoanTatTienTrinh).
    /// Trả null khi CV hợp lệ để nộp.
    /// </summary>
    private static string ValidateCVSanSangNop(CVUngVienEntity cv)
    {
        switch (cv.TrangThaiCV)
        {
            case TrangThaiCV.VoHieuHoa:
                return "CV đã bị vô hiệu hóa, vui lòng chọn CV khác.";
            case TrangThaiCV.Loi:
                return "CV đang gặp lỗi xử lý, vui lòng thử lại hoặc chọn CV khác.";
            case TrangThaiCV.DangXuLy:
                return cv.TrangThaiTienTrinhCV switch
                {
                    TrangThaiTienTrinhCV.ChoUngVienKiemTraLai => "CV do AI tạo cần bạn kiểm tra và duyệt trước khi nộp.",
                    TrangThaiTienTrinhCV.KhoiTaoMoi or TrangThaiTienTrinhCV.DangChinhSua => "CV đang soạn thảo, vui lòng hoàn tất trước khi nộp.",
                    TrangThaiTienTrinhCV.DangTaiLenStorage or TrangThaiTienTrinhCV.KiemTraDinhDangVaVirus => "CV đang tải lên/kiểm tra, vui lòng đợi hoàn tất.",
                    TrangThaiTienTrinhCV.DangThuThapThongTin or TrangThaiTienTrinhCV.DangGoiModelTongHop => "CV AI đang được tạo, vui lòng đợi hoàn tất.",
                    _ => "CV đang xử lý, vui lòng đợi hoàn tất trước khi nộp."
                };
            case TrangThaiCV.SanSang:
                if (cv.TrangThaiTienTrinhCV != TrangThaiTienTrinhCV.HoanTatTienTrinh)
                    return "Trạng thái CV không nhất quán, vui lòng hoàn tất tiến trình tạo CV.";
                return null;
            default:
                return "Trạng thái CV không hợp lệ.";
        }
    }
}