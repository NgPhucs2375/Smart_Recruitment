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
            .Include(x => x.HoSoUngVien)
            .FirstOrDefaultAsync(x => x.Id == request.CVUngVienId, cancellationToken);
        if (cv == null) return new Response<int>("CV không tồn tại.");

        var job = await context.TinTuyenDungs
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.TinTuyenDungId, cancellationToken);
        if (job == null) return new Response<int>("Tin tuyển dụng không tồn tại.");

        // HoSo suy ra từ CV (DonUngTuyen không còn HoSoUngVienId trực tiếp).
        if (cv.HoSoUngVien == null)
        {
            return new Response<int>("CV không gắn với hồ sơ ứng viên hợp lệ.");
        }

        // Chỉ chính chủ CV (UNG_VIEN) mới được nộp đơn.
        var ctx = await current.ResolveAsync();
        if (ctx.VaiTro == VaiTroNguoiDung.UNG_VIEN && cv.HoSoUngVien.NguoiDungId != ctx.Id)
        {
            return new Response<int>("CV không thuộc về ứng viên.");
        }

        // Gate CV: nhánh thủ công không có state/vòng đời, chỉ cần chưa bị xóa.
        var cvError = ValidateCVSanSangNop(cv);
        if (cvError != null) return new Response<int>(cvError);

        if (job.TrangThai != TrangThaiTinTuyenDung.DangTuyen)
        {
            return new Response<int>("Tin tuyển dụng không còn nhận hồ sơ.");
        }

        if (await context.DonUngTuyens.AnyAsync(x => x.TinTuyenDungId == request.TinTuyenDungId && x.CVUngVien.HoSoUngVienId == cv.HoSoUngVienId, cancellationToken))
        {
            return new Response<int>("Ứng viên đã nộp đơn cho tin này.");
        }

        var entity = new DonUngTuyenEntity
        {
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
    /// Gate nộp đơn: CV thủ công (snapshot JSON, không state) chỉ cần chưa bị xóa.
    /// Trả null khi CV hợp lệ để nộp.
    /// </summary>
    private static string ValidateCVSanSangNop(CVUngVienEntity cv)
    {
        if (cv.IsDaXoa)
            return "CV đã bị xóa, vui lòng chọn CV khác.";
        return null;
    }
}