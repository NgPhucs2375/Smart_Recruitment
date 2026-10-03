using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Dashboard.Queries.GetAdminSummary;

/// <summary>
/// Tổng hợp số liệu admin: COUNT/GROUP BY trên DB, không trả row chi tiết.
/// Phạm vi: QUAN_TRI_VIEN qua resource "dashboard/show".
/// </summary>
public class GetAdminSummaryQuery : IRequest<Response<GetAdminSummaryViewModel>>
{
    public int SoNgay { get; set; } = 14;
}

public class GetAdminSummaryQueryHandler(
    IApplicationDbContext context)
    : IRequestHandler<GetAdminSummaryQuery, Response<GetAdminSummaryViewModel>>
{
    private static readonly TrangThaiTinTuyenDung[] PendingStatuses =
    {
        TrangThaiTinTuyenDung.ChoDuyetHeThong,
        TrangThaiTinTuyenDung.ChoAdminDuyet,
        TrangThaiTinTuyenDung.ChoNguoiDaiDienDuyet
    };

    public async Task<Response<GetAdminSummaryViewModel>> Handle(
        GetAdminSummaryQuery request,
        CancellationToken cancellationToken)
    {
        var days = request.SoNgay > 0 && request.SoNgay <= 60 ? request.SoNgay : 14;
        var from = DateTime.UtcNow.Date.AddDays(-(days - 1));

        var vm = new GetAdminSummaryViewModel();

        vm.TongNguoiDung = await context.NguoiDungs
            .AsNoTracking()
            .CountAsync(cancellationToken);

        var byRole = await context.NguoiDungs
            .AsNoTracking()
            .GroupBy(x => x.VaiTro)
            .Select(g => new { VaiTro = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        vm.SoUngVien = byRole
            .Where(x => x.VaiTro == VaiTroNguoiDung.UNG_VIEN)
            .Sum(x => x.Count);

        vm.SoNhaTuyenDung = byRole
            .Where(x => x.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN ||
                        x.VaiTro == VaiTroNguoiDung.NHAN_SU)
            .Sum(x => x.Count);

        vm.TongTinTuyenDung = await context.TinTuyenDungs
            .AsNoTracking()
            .CountAsync(cancellationToken);

        vm.TinChoDuyet = await context.TinTuyenDungs
            .AsNoTracking()
            .CountAsync(x => PendingStatuses.Contains(x.TrangThai), cancellationToken);

        vm.TongCV = await context.CVUngViens
            .AsNoTracking()
            .CountAsync(x => !x.IsDaXoa, cancellationToken);

        vm.ThemeDangBat = await context.CvThemes
            .AsNoTracking()
            .CountAsync(x => x.IsActive, cancellationToken);

        var tinByDay = await context.TinTuyenDungs
            .AsNoTracking()
            .Where(x => x.Created >= from)
            .GroupBy(x => x.Created.Date)
            .Select(g => new { Ngay = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var donByDay = await context.DonUngTuyens
            .AsNoTracking()
            .Where(x => x.Created >= from)
            .GroupBy(x => x.Created.Date)
            .Select(g => new { Ngay = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var userByDay = await context.NguoiDungs
            .AsNoTracking()
            .Where(x => x.Created >= from)
            .GroupBy(x => x.Created.Date)
            .Select(g => new { Ngay = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        for (var i = 0; i < days; i++)
        {
            var day = from.AddDays(i);
            vm.TinTheoNgay.Add(new DayPoint
            {
                Ngay = day.ToString("dd/MM"),
                SoLuong = tinByDay.FirstOrDefault(x => x.Ngay == day)?.Count ?? 0
            });
            vm.DonTheoNgay.Add(new DayPoint
            {
                Ngay = day.ToString("dd/MM"),
                SoLuong = donByDay.FirstOrDefault(x => x.Ngay == day)?.Count ?? 0
            });
            vm.NguoiDungTheoNgay.Add(new DayPoint
            {
                Ngay = day.ToString("dd/MM"),
                SoLuong = userByDay.FirstOrDefault(x => x.Ngay == day)?.Count ?? 0
            });
        }

        vm.TinChoDuyetMoiNhat = await context.TinTuyenDungs
            .AsNoTracking()
            .Where(x => PendingStatuses.Contains(x.TrangThai))
            .OrderByDescending(x => x.Created)
            .Take(5)
            .Select(x => new PendingPostItem
            {
                Id = x.Id,
                TieuDe = x.TieuDe,
                TrangThai = x.TrangThai.ToString(),
                Created = x.Created,
                TenDoanhNghiep = x.DoanhNghiep.TenDoanhNghiep
            })
            .ToListAsync(cancellationToken);

        vm.DonMoiNhat = await context.DonUngTuyens
            .AsNoTracking()
            .OrderByDescending(x => x.Created)
            .Take(5)
            .Select(x => new RecentApplicationItem
            {
                Id = x.Id,
                TinTieuDe = x.TinTuyenDung.TieuDe,
                NgayUngTuyen = x.NgayUngTuyen,
                TrangThai = x.TrangThai.ToString()
            })
            .ToListAsync(cancellationToken);

        return new Response<GetAdminSummaryViewModel>(vm);
    }
}
