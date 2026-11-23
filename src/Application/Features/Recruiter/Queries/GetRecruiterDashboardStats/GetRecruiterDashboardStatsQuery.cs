using Application.DTOs.Recruiter;
using Application.Features.BaoCao.Queries.GetBaoCaoTuyenDung;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Recruiter.Queries.GetRecruiterDashboardStats;

/// <summary>
/// Số liệu dashboard tuyển dụng, tính trên toàn bộ dữ liệu thay vì 100 dòng đầu
/// mà giao diện từng tải về. Người đại diện thấy cả doanh nghiệp;
/// nhân sự chỉ thấy tin do chính mình đăng (đúng phạm vi danh sách đơn của họ).
/// </summary>
public sealed class GetRecruiterDashboardStatsQuery : IRequest<Response<RecruiterDashboardStats>>;

public sealed class GetRecruiterDashboardStatsQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<GetRecruiterDashboardStatsQuery, Response<RecruiterDashboardStats>>
{
    private static readonly TrangThaiDonUngTuyen[] ChuaXem =
    [
        TrangThaiDonUngTuyen.KhoiTao, TrangThaiDonUngTuyen.LoiXuLyHoSo,
        TrangThaiDonUngTuyen.ChoXuLy
    ];

    public async Task<Response<RecruiterDashboardStats>> Handle(
        GetRecruiterDashboardStatsQuery request,
        CancellationToken cancellationToken)
    {
        var (scope, error) = await RecruiterQueryAccess.ResolveAsync(current, representativeOnly: false);
        if (scope is null) return new Response<RecruiterDashboardStats>(error!);

        var laNhanSu = scope.Actor.VaiTro == VaiTroNguoiDung.NHAN_SU;
        var jobs = context.TinTuyenDungs.AsNoTracking()
            .Where(x => x.DoanhNghiepId == scope.CompanyId);
        var dons = context.DonUngTuyens.AsNoTracking()
            .Where(x => x.DoanhNghiepId == scope.CompanyId);
        if (laNhanSu)
        {
            jobs = jobs.Where(x => x.NguoiDangTinId == scope.Actor.Id);
            dons = dons.Where(x => x.TinTuyenDung.NguoiDangTinId == scope.Actor.Id);
        }

        var homNay = DateTime.UtcNow.Date;
        var sau7Ngay = homNay.AddDays(8);
        var batDau7Ngay = homNay.AddDays(-6);

        var vm = new RecruiterDashboardStats
        {
            TongTin = await jobs.CountAsync(cancellationToken),
            TinDangTuyen = await jobs.CountAsync(
                x => x.TrangThai == TrangThaiTinTuyenDung.DangTuyen,
                cancellationToken),
            TongDon = await dons.CountAsync(cancellationToken),
            UngVienDuyNhat = await dons
                .Select(x => x.HoSoUngVienId ?? x.CVUngVien.HoSoUngVienId)
                .Distinct()
                .CountAsync(cancellationToken),
            DonChuaXem = await dons.CountAsync(
                x => ChuaXem.Contains(x.TrangThai),
                cancellationToken),
            DonPhuHop = await dons.CountAsync(
                x => x.TrangThai == TrangThaiDonUngTuyen.PhuHop,
                cancellationToken),
            TinSapHetHan7Ngay = await jobs.CountAsync(
                x => x.TrangThai == TrangThaiTinTuyenDung.DangTuyen
                     && x.NgayHetHan != null
                     && x.NgayHetHan >= homNay
                     && x.NgayHetHan < sau7Ngay,
                cancellationToken)
        };

        var demTheoNgay = await dons
            .Where(x => (x.NgayUngTuyen ?? x.Created) >= batDau7Ngay)
            .GroupBy(x => (x.NgayUngTuyen ?? x.Created).Date)
            .Select(g => new { Ngay = g.Key, SoLuong = g.Count() })
            .ToListAsync(cancellationToken);
        var soTheoNgay = demTheoNgay.ToDictionary(x => x.Ngay, x => x.SoLuong);
        vm.XuHuong7Ngay = Enumerable.Range(0, 7)
            .Select(i => batDau7Ngay.AddDays(i))
            .Select(ngay => new RecruiterDashboardNgay
            {
                Ngay = ngay.ToString("yyyy-MM-dd"),
                SoLuong = soTheoNgay.GetValueOrDefault(ngay)
            })
            .ToList();

        vm.DonTheoTrangThai = (await dons
                .GroupBy(x => x.TrangThai)
                .Select(g => new { TrangThai = g.Key, SoLuong = g.Count() })
                .ToListAsync(cancellationToken))
            .Select(x => new RecruiterDashboardTrangThai
            {
                TrangThaiId = (int)x.TrangThai,
                TrangThai = BaoCaoLabels.NhanTrangThaiDon((int)x.TrangThai),
                SoLuong = x.SoLuong
            })
            .OrderByDescending(x => x.SoLuong)
            .ToList();

        if (!laNhanSu)
        {
            var thanhVien = await context.HoSoNhaTuyenDungs.AsNoTracking()
                .Where(x => x.DoanhNghiepId == scope.CompanyId)
                .Select(x => new { x.NguoiDungId, x.HoTen, x.ChucVu })
                .ToListAsync(cancellationToken);
            var tinTheoNguoi = (await jobs
                    .GroupBy(x => x.NguoiDangTinId)
                    .Select(g => new { Id = g.Key, SoLuong = g.Count() })
                    .ToListAsync(cancellationToken))
                .ToDictionary(x => x.Id, x => x.SoLuong);
            var donTheoNguoi = (await dons
                    .GroupBy(x => x.TinTuyenDung.NguoiDangTinId)
                    .Select(g => new { Id = g.Key, SoLuong = g.Count() })
                    .ToListAsync(cancellationToken))
                .ToDictionary(x => x.Id, x => x.SoLuong);

            vm.ThanhVien = thanhVien
                .Select(x => new RecruiterDashboardThanhVien
                {
                    NguoiDungId = x.NguoiDungId,
                    HoTen = x.HoTen ?? $"Người dùng #{x.NguoiDungId}",
                    ChucVu = x.ChucVu ?? "",
                    SoTin = tinTheoNguoi.GetValueOrDefault(x.NguoiDungId),
                    SoDon = donTheoNguoi.GetValueOrDefault(x.NguoiDungId)
                })
                .OrderByDescending(x => x.SoDon)
                .ThenBy(x => x.HoTen)
                .ToList();
        }

        return new Response<RecruiterDashboardStats>(vm);
    }
}
