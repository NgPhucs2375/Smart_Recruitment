using Application.Exceptions;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.DonUngTuyen;

/// <summary>
/// Quyền đọc một đơn ứng tuyển, dùng chung cho query chi tiết và query lịch sử
/// trạng thái. Tập trung ở đây để hai endpoint không lệch nhau khi chính sách đổi.
/// </summary>
public static class DonUngTuyenAccess
{
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

        var ctx = await current.ResolveAsync();

        var accessible = ctx.VaiTro == VaiTroNguoiDung.QUAN_TRI_VIEN || (ctx.VaiTro == VaiTroNguoiDung.UNG_VIEN
            ? entity.CVUngVien != null &&
              entity.CVUngVien.HoSoUngVien != null &&
              entity.CVUngVien.HoSoUngVien.NguoiDungId == ctx.Id
            : ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN
                ? entity.TinTuyenDung.DoanhNghiepId == ctx.DoanhNghiepId
                : ctx.VaiTro == VaiTroNguoiDung.NHAN_SU &&
                  entity.TinTuyenDung.DoanhNghiepId == ctx.DoanhNghiepId);

        if (!accessible)
            throw new ApiException("Bạn không có quyền xem đơn ứng tuyển này.", 403);

        return entity;
    }
}
