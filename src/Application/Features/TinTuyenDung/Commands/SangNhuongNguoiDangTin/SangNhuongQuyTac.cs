#nullable enable
using Application.Exceptions;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.TinTuyenDung.Commands.SangNhuongNguoiDangTin;

/// <summary>Nhân sự đang làm việc cho doanh nghiệp và đủ nhận tin.</summary>
public sealed record NguoiNhan(int NguoiDungId, string HoTen);

/// <summary>
/// Bất biến chung của luồng sang nhượng người đăng tin: ai được giao, ai được nhận.
/// Tách ra để lệnh "từng tin" và lệnh "giao hết" không tự diễn giải quy tắc khác nhau.
/// </summary>
public static class SangNhuongQuyTac
{
    /// <summary>
    /// ReferenceType riêng. Màn danh sách tin lấy notification cuối có
    /// ReferenceType "TinTuyenDung" để hiển thị làm GhiChuKiemDuyet, nên dùng lại
    /// loại đó sẽ biến "đã giao cho B" thành ghi chú kiểm duyệt trên UI.
    /// </summary>
    public const string ReferenceLoai = "SangNhuongNguoiDangTin";

    public static void EnsureActor(CurrentNguoiDungContext user, int doanhNghiepIdCuaTin)
    {
        if (user.VaiTro == VaiTroNguoiDung.QUAN_TRI_VIEN) return;
        if (user.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN && user.DoanhNghiepId == doanhNghiepIdCuaTin) return;
        throw new ApiException(
            "Chỉ người đại diện của doanh nghiệp này hoặc quản trị viên được giao tin cho nhân sự khác.", 403);
    }

    /// <summary>
    /// Người nhận phải còn hoạt động, là Nhân sự/Người đại diện và có hồ sơ tại đúng
    /// doanh nghiệp của tin. Chặn luôn đường chuyển tin sang công ty khác, vì chủ tin
    /// là điều kiện đọc CV, đọc đánh giá và nhận email ứng viên.
    /// </summary>
    public static async Task<NguoiNhan?> ResolveNguoiNhanAsync(
        IApplicationDbContext context, int nguoiDungId, int doanhNghiepId, CancellationToken ct) =>
        await context.HoSoNhaTuyenDungs
            .AsNoTracking()
            .Where(h => h.NguoiDungId == nguoiDungId &&
                        h.DoanhNghiepId == doanhNghiepId &&
                        h.NguoiDung.IsActive &&
                        (h.NguoiDung.VaiTro == VaiTroNguoiDung.NHAN_SU ||
                         h.NguoiDung.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN))
            .Select(h => new NguoiNhan(h.NguoiDungId, h.HoTen))
            .FirstOrDefaultAsync(ct);

    /// <summary>Tên hiển thị phía nhà tuyển dụng; Admin không có hồ sơ nhà tuyển dụng.</summary>
    public static async Task<string> ResolveTenAsync(
        IApplicationDbContext context, int nguoiDungId, CancellationToken ct) =>
        await context.HoSoNhaTuyenDungs
            .AsNoTracking()
            .Where(h => h.NguoiDungId == nguoiDungId)
            .Select(h => h.HoTen)
            .FirstOrDefaultAsync(ct) ?? "Quản trị viên hệ thống";

    /// <summary>tinId = null cho thông báo gộp nhiều tin, để UI không trỏ vào một tin bừa.</summary>
    public static async Task GhiThongBaoAsync(
        INotificationService notifications, int nguoiNhanId, string tieuDe, string noiDung, int? tinId)
    {
        await notifications.SendToUserAsync(nguoiNhanId, new Application.DTOs.ThongBao.ThongBaoDTO
        {
            TieuDe = tieuDe,
            NoiDung = noiDung,
            LoaiThongBao = LoaiThongBao.ViecLamMoi,
            ReferenceType = ReferenceLoai,
            ReferenceId = tinId
        });
    }
}
