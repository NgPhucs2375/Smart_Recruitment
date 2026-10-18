using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.BaoCao.Queries.GetBaoCaoTuyenDung;

/// <summary>
/// Báo cáo tuyển dụng cho trang /reports: QUAN_TRI_VIEN thấy toàn hệ thống,
/// NGUOI_DAI_DIEN / NHAN_SU chỉ thấy tin và đơn của doanh nghiệp mình
/// (cùng cách scoping với GetAllDonUngTuyens).
/// Toàn bộ số liệu được COUNT/GROUP BY trên DB, không tải row chi tiết.
/// KyNgay: 0 = toàn bộ thời gian, ngược lại = số ngày tính đến hôm nay.
/// </summary>
public class GetBaoCaoTuyenDungQuery : IRequest<Response<BaoCaoTuyenDungVm>>
{
    public int KyNgay { get; set; } = 30;
}

public class GetBaoCaoTuyenDungQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<GetBaoCaoTuyenDungQuery, Response<BaoCaoTuyenDungVm>>
{
    private static readonly int[] KyHopLe = [0, 30, 90];

    private static readonly TrangThaiTinTuyenDung[] TinDaDuyet =
    [
        TrangThaiTinTuyenDung.DangTuyen, TrangThaiTinTuyenDung.TamDung,
        TrangThaiTinTuyenDung.HetHan, TrangThaiTinTuyenDung.DaDong
    ];

    private static readonly TrangThaiTinTuyenDung[] TinChoDuyet =
    [
        TrangThaiTinTuyenDung.ChoDuyetHeThong, TrangThaiTinTuyenDung.ChoAdminDuyet,
        TrangThaiTinTuyenDung.ChoNguoiDaiDienDuyet
    ];

    private static readonly TrangThaiTinTuyenDung[] TinBiTuChoi =
    [
        TrangThaiTinTuyenDung.TuChoi, TrangThaiTinTuyenDung.BiKhoa
    ];

    public async Task<Response<BaoCaoTuyenDungVm>> Handle(
        GetBaoCaoTuyenDungQuery request,
        CancellationToken cancellationToken)
    {
        var ky = KyHopLe.Contains(request.KyNgay) ? request.KyNgay : 30;
        var ctx = await current.ResolveAsync();
        var laAdmin = ctx.VaiTro == VaiTroNguoiDung.QUAN_TRI_VIEN;

        var homNay = DateTime.UtcNow.Date;
        DateTime? tuNgay = ky == 0 ? null : homNay.AddDays(-(ky - 1));
        DateTime? kyTruocBatDau = ky == 0 ? null : tuNgay!.Value.AddDays(-ky);

        var tinGoc = context.TinTuyenDungs.AsNoTracking();
        var donGoc = context.DonUngTuyens.AsNoTracking();
        if (!laAdmin)
        {
            tinGoc = tinGoc.Where(t => t.DoanhNghiepId == ctx.DoanhNghiepId);
            donGoc = donGoc.Where(d => d.TinTuyenDung.DoanhNghiepId == ctx.DoanhNghiepId);
        }

        var tinKyNay = tuNgay.HasValue
            ? tinGoc.Where(t => t.Created >= tuNgay.Value)
            : tinGoc;
        var donKyNay = tuNgay.HasValue
            ? donGoc.Where(d => (d.NgayUngTuyen ?? d.Created) >= tuNgay.Value)
            : donGoc;

        var vm = new BaoCaoTuyenDungVm
        {
            GeneratedAtUtc = DateTime.UtcNow,
            KyNgay = ky,
            PhamVi = laAdmin ? "he-thong" : "doanh-nghiep",
            TinDaDang = await tinKyNay.CountAsync(cancellationToken),
            LuotNop = await donKyNay.CountAsync(cancellationToken),
            UngVienDuyNhat = await donKyNay
                .Select(d => d.HoSoUngVienId ?? d.CVUngVien.HoSoUngVienId)
                .Distinct()
                .CountAsync(cancellationToken)
        };

        if (tuNgay.HasValue)
        {
            vm.TinKyTruoc = await tinGoc.CountAsync(
                t => t.Created >= kyTruocBatDau!.Value && t.Created < tuNgay.Value,
                cancellationToken);
            vm.TyLeTin = TinhTyLe(vm.TinDaDang, vm.TinKyTruoc.Value);

            vm.LuotNopKyTruoc = await donGoc.CountAsync(
                d => (d.NgayUngTuyen ?? d.Created) >= kyTruocBatDau!.Value
                     && (d.NgayUngTuyen ?? d.Created) < tuNgay.Value,
                cancellationToken);
            vm.TyLeNop = TinhTyLe(vm.LuotNop, vm.LuotNopKyTruoc.Value);
        }

        vm.KetQua = (await donKyNay
            .GroupBy(d => d.TrangThai)
            .Select(g => new { TrangThai = g.Key, SoLuong = g.Count() })
            .OrderByDescending(x => x.SoLuong)
            .ToListAsync(cancellationToken))
            .Select(x => new KetQuaTheoTrangThaiVm
            {
                TrangThaiId = (int)x.TrangThai,
                TrangThai = x.TrangThai.ToString(),
                SoLuong = x.SoLuong
            }).ToList();

        vm.XuHuong = (await donKyNay
            .GroupBy(d => (d.NgayUngTuyen ?? d.Created).Date)
            .Select(g => new { Ngay = g.Key, SoLuong = g.Count() })
            .OrderBy(x => x.Ngay)
            .ToListAsync(cancellationToken))
            .Select(x => new DiemXuHuongVm
            {
                Ngay = x.Ngay.ToString("yyyy-MM-dd"),
                SoLuong = x.SoLuong
            }).ToList();

        var top = await donKyNay
            .GroupBy(d => d.TinTuyenDungId)
            .Select(g => new { TinId = g.Key, SoDon = g.Count() })
            .OrderByDescending(x => x.SoDon)
            .Take(5)
            .ToListAsync(cancellationToken);
        var topIds = top.Select(x => x.TinId).ToList();
        var tuDienTin = (await tinGoc
            .Where(t => topIds.Contains(t.Id))
            .Select(t => new { t.Id, t.TieuDe, t.TrangThai })
            .ToListAsync(cancellationToken))
            .ToDictionary(t => t.Id);
        vm.TopTin = top.Select(x =>
        {
            tuDienTin.TryGetValue(x.TinId, out var tin);
            var trangThaiId = tin == null ? -1 : (int)tin.TrangThai;
            return new TinNhieuDonVm
            {
                Id = x.TinId,
                TieuDe = tin?.TieuDe ?? $"Tin #{x.TinId}",
                TrangThaiId = trangThaiId,
                TrangThai = tin == null ? "Không rõ" : BaoCaoLabels.NhanTrangThaiTin(trangThaiId),
                SoDon = x.SoDon
            };
        }).ToList();

        var duyetTheoTrangThai = await tinKyNay
            .GroupBy(t => t.TrangThai)
            .Select(g => new { TrangThai = g.Key, SoLuong = g.Count() })
            .ToListAsync(cancellationToken);
        var daDuyet = duyetTheoTrangThai.Where(x => TinDaDuyet.Contains(x.TrangThai)).Sum(x => x.SoLuong);
        var choDuyet = duyetTheoTrangThai.Where(x => TinChoDuyet.Contains(x.TrangThai)).Sum(x => x.SoLuong);
        var tuChoi = duyetTheoTrangThai.Where(x => TinBiTuChoi.Contains(x.TrangThai)).Sum(x => x.SoLuong);
        var nhap = duyetTheoTrangThai.Where(x => x.TrangThai == TrangThaiTinTuyenDung.Nhap).Sum(x => x.SoLuong);
        vm.DuyetTin = new DuyetTinVm
        {
            DaDuyet = daDuyet,
            ChoDuyet = choDuyet,
            TuChoi = tuChoi,
            Nhap = nhap,
            TyLeDuyet = daDuyet + tuChoi == 0
                ? null
                : Math.Round(daDuyet * 100d / (daDuyet + tuChoi), 1)
        };

        return new Response<BaoCaoTuyenDungVm>(vm);
    }

    private static double? TinhTyLe(int hienTai, int kyTruoc)
    {
        if (kyTruoc == 0) return hienTai == 0 ? 0 : null;
        return Math.Round((hienTai - kyTruoc) * 100d / kyTruoc, 1);
    }
}
