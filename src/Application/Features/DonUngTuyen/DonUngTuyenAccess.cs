using Application.Exceptions;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.DonUngTuyen;

/// <summary>
/// Quyền đọc và xử lý một đơn ứng tuyển, dùng chung cho danh sách, chi tiết,
/// lịch sử trạng thái và state machine. Tập trung ở đây để các endpoint không
/// lệch nhau khi chính sách đổi.
/// </summary>
public static class DonUngTuyenAccess
{
    /// <summary>
    /// Nhân sự chỉ phạm vi tin mình đăng; Người đại diện phạm vi cả doanh nghiệp.
    /// Bản dịch SQL của <see cref="CanAccess"/> — giữ hai hàm cạnh nhau để sửa cùng lúc.
    /// </summary>
    public static IQueryable<Domain.Entities.DonUngTuyen> ScopeReadable(
        IQueryable<Domain.Entities.DonUngTuyen> query, CurrentNguoiDungContext user) => user.VaiTro switch
    {
        VaiTroNguoiDung.QUAN_TRI_VIEN => query,
        VaiTroNguoiDung.NHAN_SU => query.Where(d =>
            d.TinTuyenDung.NguoiDangTinId == user.Id && d.TinTuyenDung.DoanhNghiepId == user.DoanhNghiepId),
        VaiTroNguoiDung.NGUOI_DAI_DIEN => query.Where(d => d.TinTuyenDung.DoanhNghiepId == user.DoanhNghiepId),
        VaiTroNguoiDung.UNG_VIEN => query.Where(d => d.CVUngVien.HoSoUngVien.NguoiDungId == user.Id),
        _ => query.Where(_ => false)
    };

    /// <summary>Phiên bản kiểm tra một entity đã load, dùng cho state machine.</summary>
    public static bool CanAccess(CurrentNguoiDungContext user, Domain.Entities.DonUngTuyen application)
    {
        if (user.VaiTro == VaiTroNguoiDung.QUAN_TRI_VIEN) return true;
        if (user.VaiTro == VaiTroNguoiDung.UNG_VIEN)
            return application.CVUngVien?.HoSoUngVien?.NguoiDungId == user.Id;
        var job = application.TinTuyenDung;
        if (job is null) return false;
        return user.VaiTro switch
        {
            VaiTroNguoiDung.NGUOI_DAI_DIEN => job.DoanhNghiepId == user.DoanhNghiepId,
            VaiTroNguoiDung.NHAN_SU => job.NguoiDangTinId == user.Id && job.DoanhNghiepId == user.DoanhNghiepId,
            _ => false
        };
    }

    /// <summary>null = đơn không tồn tại. Vượt quyền thì ném ApiException 403.</summary>
    public static async Task<Domain.Entities.DonUngTuyen> LoadReadableAsync(
        IApplicationDbContext context,
        ICurrentNguoiDungService current,
        int donId,
        CancellationToken ct = default)
    {
        var entity = await context.DonUngTuyens
            .Include(d => d.TinTuyenDung)
            .Include(d => d.CVUngVien).ThenInclude(cv => cv.HoSoUngVien)
            .FirstOrDefaultAsync(d => d.Id == donId, ct);

        if (entity == null)
            return null;

        if (!CanAccess(await current.ResolveAsync(), entity))
            throw new ApiException("Bạn không có quyền xem đơn ứng tuyển này.", 403);

        return entity;
    }
}
