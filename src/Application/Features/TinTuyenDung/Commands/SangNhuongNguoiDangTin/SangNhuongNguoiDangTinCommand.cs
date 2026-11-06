using Application.Exceptions;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.TinTuyenDung.Commands.SangNhuongNguoiDangTin;

/// <summary>
/// Chuyển chủ sở hữu nghiệp vụ của một tin sang nhân sự khác cùng doanh nghiệp.
/// Chỉ đổi NguoiDangTinId: tin, đơn ứng tuyển, đánh giá, kỹ năng, điểm phù hợp và
/// lịch sử trạng thái giữ nguyên, nên ứng viên không phải ứng tuyển lại.
/// </summary>
public class SangNhuongNguoiDangTinCommand : IRequest<Response<int>>
{
    public int Id { get; set; }
    public int NguoiDangTinMoiId { get; set; }
}

public class SangNhuongNguoiDangTinCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current,
    INotificationService notifications)
    : IRequestHandler<SangNhuongNguoiDangTinCommand, Response<int>>
{
    public async Task<Response<int>> Handle(SangNhuongNguoiDangTinCommand request, CancellationToken ct)
    {
        var job = await context.TinTuyenDungs
            .AsTracking()
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);
        if (job == null)
            return new Response<int>("Không tìm thấy tin tuyển dụng.");

        var user = await current.ResolveAsync();
        SangNhuongQuyTac.EnsureActor(user, job.DoanhNghiepId);

        if (request.NguoiDangTinMoiId == job.NguoiDangTinId)
            return new Response<int>(job.Id, "Tin đã thuộc về người này.");

        var nguoiNhan = await SangNhuongQuyTac.ResolveNguoiNhanAsync(
            context, request.NguoiDangTinMoiId, job.DoanhNghiepId, ct);
        if (nguoiNhan == null)
            throw new ApiException(
                "Người nhận phải còn hoạt động và là nhân sự của đúng doanh nghiệp có tin này.", 403);

        var nguoiGui = job.NguoiDangTinId;
        var tenNguoiGui = await SangNhuongQuyTac.ResolveTenAsync(context, nguoiGui, ct);
        var tenNguoiDangGiao = await SangNhuongQuyTac.ResolveTenAsync(context, user.Id, ct);
        var tieuDeTin = string.IsNullOrWhiteSpace(job.TieuDe) ? $"Tin #{job.Id}" : job.TieuDe;

        job.NguoiDangTinId = nguoiNhan.NguoiDungId;
        job.LastModified = DateTime.UtcNow;
        await context.SaveChangesAsync(ct);

        // Hai thông báo riêng vì hai người cần hành động khác nhau; ghi cả tên người
        // giao vào nội dung vì Notification không có cột lưu tác giả.
        await SangNhuongQuyTac.GhiThongBaoAsync(
            notifications, nguoiNhan.NguoiDungId,
            $"Tin {tieuDeTin} vừa được giao cho bạn",
            $"{tenNguoiDangGiao} đã chuyển quyền phụ trách tin \"{tieuDeTin}\" từ {tenNguoiGui} sang bạn. " +
            "Toàn bộ hồ sơ đã ứng tuyển và lịch sử xử lý vẫn giữ nguyên.",
            job.Id);
        if (nguoiGui > 0)
            await SangNhuongQuyTac.GhiThongBaoAsync(
                notifications, nguoiGui,
                $"Tin {tieuDeTin} đã chuyển sang người khác",
                $"{tenNguoiDangGiao} đã giao tin \"{tieuDeTin}\" cho {nguoiNhan.HoTen}. " +
                "Bạn không còn thấy tin này trong danh sách tin của mình.",
                job.Id);

        return new Response<int>(job.Id, $"Đã giao tin cho {nguoiNhan.HoTen}.");
    }
}
