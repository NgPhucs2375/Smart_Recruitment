using Application.Exceptions;
using Application.Interfaces;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Application.Security;

/// <summary>Object-level write rules, independent of configurable endpoint grants.</summary>
public static class ResourceAccess
{
    public static IQueryable<Domain.Entities.DanhGia> ScopeReviews(IQueryable<Domain.Entities.DanhGia> query, CurrentNguoiDungContext user) => user.VaiTro switch
    {
        VaiTroNguoiDung.QUAN_TRI_VIEN => query,
        VaiTroNguoiDung.UNG_VIEN => query.Where(r => r.DonUngTuyen.CVUngVien.HoSoUngVien.NguoiDungId == user.Id),
        VaiTroNguoiDung.NHAN_SU => query.Where(r => r.DonUngTuyen.TinTuyenDung.NguoiDangTinId == user.Id),
        VaiTroNguoiDung.NGUOI_DAI_DIEN => query.Where(r => r.DonUngTuyen.TinTuyenDung.DoanhNghiepId == user.DoanhNghiepId),
        _ => query.Where(_ => false)
    };

    public static async Task EnsureCvOwnerAsync(IApplicationDbContext db, CurrentNguoiDungContext user, int cvId, CancellationToken ct)
    {
        if (user.VaiTro == VaiTroNguoiDung.QUAN_TRI_VIEN) return;
        if (user.VaiTro != VaiTroNguoiDung.UNG_VIEN || !await db.CVUngViens.AsNoTracking()
                .AnyAsync(cv => cv.Id == cvId && !cv.IsDaXoa && cv.HoSoUngVien.NguoiDungId == user.Id, ct))
            throw new ApiException("Bạn chỉ được thay đổi phân tích CV của chính mình.", 403);
    }

    public static async Task EnsureApplicationReviewerAsync(IApplicationDbContext db, CurrentNguoiDungContext user, int applicationId, CancellationToken ct)
    {
        if (user.VaiTro == VaiTroNguoiDung.QUAN_TRI_VIEN) return;
        if (user.VaiTro is not (VaiTroNguoiDung.NHAN_SU or VaiTroNguoiDung.NGUOI_DAI_DIEN) ||
            !await db.DonUngTuyens.AsNoTracking().AnyAsync(d => d.Id == applicationId &&
                (user.VaiTro == VaiTroNguoiDung.NHAN_SU
                    ? d.TinTuyenDung.NguoiDangTinId == user.Id
                    : d.TinTuyenDung.DoanhNghiepId == user.DoanhNghiepId), ct))
            throw new ApiException("Bạn không có quyền sửa đánh giá của đơn ứng tuyển này.", 403);
    }
}
