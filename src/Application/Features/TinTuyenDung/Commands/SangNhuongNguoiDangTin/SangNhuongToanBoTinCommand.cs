using Application.Exceptions;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.TinTuyenDung.Commands.SangNhuongNguoiDangTin;

/// <summary>
/// Giao toàn bộ tin của một nhân sự trong doanh nghiệp sang nhân sự khác cùng doanh nghiệp.
/// Đây là bước bắt buộc trước khi xóa nhân sự: giữ cho không có tin nào bị "mồ côi"
/// chủ, vì chủ tin là điều kiện đọc CV/đánh giá và là người nhận thông báo ứng viên.
/// </summary>
public class SangNhuongToanBoTinCommand : IRequest<Response<int>>
{
    public int TuNguoiDangTinId { get; set; }
    public int NguoiDangTinMoiId { get; set; }
}

public class SangNhuongToanBoTinCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current,
    INotificationService notifications)
    : IRequestHandler<SangNhuongToanBoTinCommand, Response<int>>
{
    public async Task<Response<int>> Handle(SangNhuongToanBoTinCommand request, CancellationToken ct)
    {
        if (request.TuNguoiDangTinId == request.NguoiDangTinMoiId)
            throw new ApiException("Người giao và người nhận phải là hai người khác nhau.", 400);

        var user = await current.ResolveAsync();
        if (user.VaiTro is not (VaiTroNguoiDung.NGUOI_DAI_DIEN or VaiTroNguoiDung.QUAN_TRI_VIEN))
            throw new ApiException(
                "Chỉ người đại diện của doanh nghiệp hoặc quản trị viên được giao tin cho nhân sự khác.", 403);

        // Người đại diện chỉ được xoay tin trong nội bộ doanh nghiệp của mình; Admin không bị chặn.
        var doanhNghiepCuaNguoiGui = await context.HoSoNhaTuyenDungs
            .AsNoTracking()
            .Where(h => h.NguoiDungId == request.TuNguoiDangTinId &&
                (user.VaiTro == VaiTroNguoiDung.QUAN_TRI_VIEN || h.DoanhNghiepId == user.DoanhNghiepId))
            .Select(h => (int?)h.DoanhNghiepId)
            .FirstOrDefaultAsync(ct);
        if (doanhNghiepCuaNguoiGui == null)
            throw new ApiException("Không tìm thấy nhân sự nguồn trong doanh nghiệp của bạn.", 403);

        var nguoiNhan = await SangNhuongQuyTac.ResolveNguoiNhanAsync(
            context, request.NguoiDangTinMoiId, doanhNghiepCuaNguoiGui.Value, ct);
        if (nguoiNhan == null)
            throw new ApiException(
                "Người nhận phải còn hoạt động và là nhân sự của đúng doanh nghiệp này.", 403);

        var danhSachTin = await context.TinTuyenDungs
            .AsTracking()
            .Where(x => x.NguoiDangTinId == request.TuNguoiDangTinId &&
                        x.DoanhNghiepId == doanhNghiepCuaNguoiGui)
            .ToListAsync(ct);
        if (danhSachTin.Count == 0)
            return new Response<int>(0, "Người này không còn tin nào để giao.");

        var tenNguoiGui = await SangNhuongQuyTac.ResolveTenAsync(context, request.TuNguoiDangTinId, ct);
        var tenNguoiDangGiao = await SangNhuongQuyTac.ResolveTenAsync(context, user.Id, ct);
        var now = DateTime.UtcNow;
        foreach (var tin in danhSachTin)
        {
            tin.NguoiDangTinId = nguoiNhan.NguoiDungId;
            tin.LastModified = now;
        }
        await context.SaveChangesAsync(ct);

        var noiDungNguoiNhan =
            $"{tenNguoiDangGiao} đã chuyển {danhSachTin.Count} tin tuyển dụng từ {tenNguoiGui} sang bạn. " +
            "Các tin giữ nguyên hồ sơ ứng tuyển và lịch sử đã xử lý.";
        await SangNhuongQuyTac.GhiThongBaoAsync(
            notifications, nguoiNhan.NguoiDungId, "Bạn được giao thêm tin tuyển dụng",
            noiDungNguoiNhan, null);
        await SangNhuongQuyTac.GhiThongBaoAsync(
            notifications, request.TuNguoiDangTinId, "Đã bàn giao tin tuyển dụng",
            $"{tenNguoiDangGiao} đã giao {danhSachTin.Count} tin của bạn cho {nguoiNhan.HoTen}. " +
            "Bạn không còn phụ trách các tin này.", null);

        return new Response<int>(
            danhSachTin.Count, $"Đã giao {danhSachTin.Count} tin cho {nguoiNhan.HoTen}.");
    }
}
