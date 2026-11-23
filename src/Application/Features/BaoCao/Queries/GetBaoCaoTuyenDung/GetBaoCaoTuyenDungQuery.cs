using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.BaoCao.Queries.GetBaoCaoTuyenDung;

/// <summary>
/// Báo cáo tuyển dụng cho trang /reports: QUAN_TRI_VIEN thấy toàn hệ thống,
/// NGUOI_DAI_DIEN / NHAN_SU chỉ thấy tin và đơn của doanh nghiệp mình.
/// Số liệu tổng hợp vẫn theo doanh nghiệp, rộng hơn danh sách đơn
/// (GetAllDonUngTuyens đã thu hẹp về tin do chính Nhân sự đăng).
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

        var phe = await NapPheBuocVaThoiGianAsync(vm, donKyNay, cancellationToken);
        await NapChatLuongGoiYAsync(vm, laAdmin, ctx.DoanhNghiepId, tuNgay, cancellationToken);
        await NapHieuSuatNhanSuAsync(vm, laAdmin, ctx.DoanhNghiepId, phe, cancellationToken);

        return new Response<BaoCaoTuyenDungVm>(vm);
    }

    private sealed class DonXuLyRow
    {
        public int Id { get; set; }
        public TrangThaiDonUngTuyen TrangThai { get; set; }
        public int NguoiXuLyId { get; set; }
        public DateTime NhanLuc { get; set; }
    }

    private sealed class LichSuRow
    {
        public int DonUngTuyenId { get; set; }
        public TrangThaiDonUngTuyen TrangThaiSau { get; set; }
        public DateTime Created { get; set; }
    }

    private sealed record PheDuLieu(
        List<DonXuLyRow> DonRows,
        Dictionary<int, List<LichSuRow>> LichSuTheoDon);

    /// <summary>
    /// Phễu chuyển bước + thời gian xử lý đọc từ vệt LichSuTrangThaiDonUngTuyen.
    /// Chỉ tính các lần đổi trạng thái thật (TrangThaiTruoc != TrangThaiSau);
    /// dòng mốc sinh khi nâng cấp dữ liệu bị loại để không làm sai thời gian.
    /// </summary>
    private async Task<PheDuLieu> NapPheBuocVaThoiGianAsync(
        BaoCaoTuyenDungVm vm,
        IQueryable<Domain.Entities.DonUngTuyen> donKyNay,
        CancellationToken cancellationToken)
    {
        var donRows = await donKyNay
            .Select(d => new DonXuLyRow
            {
                Id = d.Id,
                TrangThai = d.TrangThai,
                NguoiXuLyId = d.NguoiXuLyId,
                NhanLuc = d.NgayUngTuyen ?? d.Created
            })
            .ToListAsync(cancellationToken);
        var donIds = donRows.Select(x => x.Id).ToList();

        var lichSu = donIds.Count == 0
            ? new List<LichSuRow>()
            : await context.LichSuTrangThaiDonUngTuyens.AsNoTracking()
                .Where(l => donIds.Contains(l.DonUngTuyenId)
                            && l.TrangThaiTruoc != l.TrangThaiSau)
                .Select(l => new LichSuRow
                {
                    DonUngTuyenId = l.DonUngTuyenId,
                    TrangThaiSau = l.TrangThaiSau,
                    Created = l.Created
                })
                .ToListAsync(cancellationToken);
        var lichSuTheoDon = lichSu
            .GroupBy(l => l.DonUngTuyenId)
            .ToDictionary(g => g.Key, g => g.OrderBy(x => x.Created).ToList());

        // Đơn đã kết thúc nhưng chỉ có dòng mốc (dữ liệu cũ) vẫn cần mốc quyết định:
        // dùng lần ghi lịch sử gần nhất thay vì bỏ trống.
        var mocLichSuCuoi = (await context.LichSuTrangThaiDonUngTuyens.AsNoTracking()
                .Where(l => donIds.Contains(l.DonUngTuyenId))
                .GroupBy(l => l.DonUngTuyenId)
                .Select(g => new { DonUngTuyenId = g.Key, Created = g.Max(x => x.Created) })
                .ToListAsync(cancellationToken))
            .ToDictionary(x => x.DonUngTuyenId, x => x.Created);

        var chamDaXem = 0;
        var chamPhuHop = 0;
        var chamTuChoi = 0;
        var phanHoi = new List<double>();
        var quyetDinh = new List<double>();
        var treo = 0;
        var bayGio = DateTime.UtcNow;

        foreach (var d in donRows)
        {
            lichSuTheoDon.TryGetValue(d.Id, out var su);

            bool Cham(TrangThaiDonUngTuyen trangThai) =>
                d.TrangThai == trangThai || (su is not null && su.Any(x => x.TrangThaiSau == trangThai));

            var daPhuHop = Cham(TrangThaiDonUngTuyen.PhuHop);
            var daTuChoi = Cham(TrangThaiDonUngTuyen.TuChoi);
            if (daPhuHop) chamPhuHop++;
            if (daTuChoi) chamTuChoi++;
            if (daPhuHop || daTuChoi || Cham(TrangThaiDonUngTuyen.DaXem)) chamDaXem++;

            if (su is { Count: > 0 })
                phanHoi.Add(Math.Max(0, (su[0].Created - d.NhanLuc).TotalDays));

            var quyetDinhDau = su?.FirstOrDefault(x =>
                x.TrangThaiSau is TrangThaiDonUngTuyen.PhuHop or TrangThaiDonUngTuyen.TuChoi);
            var mocQuyetDinh = quyetDinhDau?.Created;
            if (mocQuyetDinh is null
                && d.TrangThai is TrangThaiDonUngTuyen.PhuHop or TrangThaiDonUngTuyen.TuChoi
                && mocLichSuCuoi.TryGetValue(d.Id, out var mocCu))
                mocQuyetDinh = mocCu;
            if (mocQuyetDinh is not null)
                quyetDinh.Add(Math.Max(0, (mocQuyetDinh.Value - d.NhanLuc).TotalDays));

            var laDonMo = d.TrangThai is TrangThaiDonUngTuyen.KhoiTao
                or TrangThaiDonUngTuyen.LoiXuLyHoSo
                or TrangThaiDonUngTuyen.ChoXuLy
                or TrangThaiDonUngTuyen.DaXem;
            if (laDonMo)
            {
                var lanCuoi = su is { Count: > 0 } ? su[^1].Created : d.NhanLuc;
                if ((bayGio - lanCuoi).TotalDays > 7) treo++;
            }
        }

        var tongNop = vm.LuotNop;
        double TyLe(int soDon) => tongNop == 0 ? 0 : Math.Round(soDon * 100d / tongNop, 1);
        vm.PheBuoc =
        [
            new PheBuocVm
            {
                TrangThaiId = (int)TrangThaiDonUngTuyen.ChoXuLy,
                TrangThai = "Đã tiếp nhận",
                SoDon = tongNop,
                TyLe = TyLe(tongNop)
            },
            new PheBuocVm
            {
                TrangThaiId = (int)TrangThaiDonUngTuyen.DaXem,
                TrangThai = "Đã xem hồ sơ",
                SoDon = chamDaXem,
                TyLe = TyLe(chamDaXem)
            },
            new PheBuocVm
            {
                TrangThaiId = (int)TrangThaiDonUngTuyen.PhuHop,
                TrangThai = "Đánh giá phù hợp",
                SoDon = chamPhuHop,
                TyLe = TyLe(chamPhuHop)
            },
            new PheBuocVm
            {
                TrangThaiId = (int)TrangThaiDonUngTuyen.TuChoi,
                TrangThai = "Từ chối",
                SoDon = chamTuChoi,
                TyLe = TyLe(chamTuChoi)
            }
        ];
        vm.ThoiGianXuLy = new ThoiGianXuLyVm
        {
            DonCoLichSu = donRows.Count(d => lichSuTheoDon.ContainsKey(d.Id)),
            TgPhanHoiDauTbNgay = phanHoi.Count == 0 ? null : Math.Round(phanHoi.Average(), 1),
            TgQuyetDinhTbNgay = quyetDinh.Count == 0 ? null : Math.Round(quyetDinh.Average(), 1),
            DonTreoQua7Ngay = treo
        };

        return new PheDuLieu(donRows, lichSuTheoDon);
    }

    private async Task NapChatLuongGoiYAsync(
        BaoCaoTuyenDungVm vm,
        bool laAdmin,
        int? doanhNghiepId,
        DateTime? tuNgay,
        CancellationToken cancellationToken)
    {
        var kq = context.KetQuaPhuHops.AsNoTracking();
        if (!laAdmin) kq = kq.Where(x => x.TinTuyenDung.DoanhNghiepId == doanhNghiepId);
        if (tuNgay.HasValue) kq = kq.Where(x => x.EvaluateAt >= tuNgay.Value);

        var tong = await kq.CountAsync(cancellationToken);
        vm.ChatLuongGoiY.TongKetQua = tong;
        if (tong == 0) return;

        var diem = await kq.Select(x => x.DiemPhuHop).ToListAsync(cancellationToken);
        vm.ChatLuongGoiY.DiemTrungBinh = Math.Round(diem.Average(x => (double)x) * 100, 1);
        vm.ChatLuongGoiY.TyLeCao = Math.Round(diem.Count(x => x >= 0.7f) * 100d / diem.Count, 1);

        var thieu = await kq
            .Where(x => x.KyNangThieu != null && x.KyNangThieu != "")
            .Select(x => x.KyNangThieu)
            .ToListAsync(cancellationToken);
        vm.ChatLuongGoiY.TopKyNangThieu = thieu
            .SelectMany(s => s.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .GroupBy(s => s, StringComparer.OrdinalIgnoreCase)
            .Select(g => new KyNangThieuVm { Ten = g.Key, SoLuot = g.Count() })
            .OrderByDescending(x => x.SoLuot)
            .ThenBy(x => x.Ten)
            .Take(5)
            .ToList();
    }

    private async Task NapHieuSuatNhanSuAsync(
        BaoCaoTuyenDungVm vm,
        bool laAdmin,
        int? doanhNghiepId,
        PheDuLieu phe,
        CancellationToken cancellationToken)
    {
        var theoNguoi = phe.DonRows.Where(d => d.NguoiXuLyId != 0)
            .GroupBy(d => d.NguoiXuLyId)
            .ToList();
        if (theoNguoi.Count == 0) return;

        var ids = theoNguoi.Select(g => g.Key).ToList();
        var hoSoQuery = context.HoSoNhaTuyenDungs.AsNoTracking().Where(h => ids.Contains(h.NguoiDungId));
        if (!laAdmin) hoSoQuery = hoSoQuery.Where(h => h.DoanhNghiepId == doanhNghiepId);
        var tenTheoId = (await hoSoQuery
                .Select(h => new { h.NguoiDungId, h.HoTen })
                .ToListAsync(cancellationToken))
            .GroupBy(h => h.NguoiDungId)
            .ToDictionary(g => g.Key, g => g.First().HoTen);

        vm.HieuSuatNhanSu = theoNguoi
            .Select(g =>
            {
                var ds = g.ToList();
                var tg = ds
                    .Select(d => phe.LichSuTheoDon.TryGetValue(d.Id, out var su) && su.Count > 0
                        ? (double?)Math.Max(0, (su[^1].Created - d.NhanLuc).TotalDays)
                        : null)
                    .Where(x => x.HasValue)
                    .Select(x => x!.Value)
                    .ToList();
                return new HieuSuatNhanSuVm
                {
                    NguoiDungId = g.Key,
                    HoTen = tenTheoId.TryGetValue(g.Key, out var ten) ? ten : $"Người dùng #{g.Key}",
                    DonDaXuLy = ds.Count,
                    DonPhuHop = ds.Count(d => d.TrangThai == TrangThaiDonUngTuyen.PhuHop),
                    DonTuChoi = ds.Count(d => d.TrangThai == TrangThaiDonUngTuyen.TuChoi),
                    TgXuLyTbNgay = tg.Count == 0 ? null : Math.Round(tg.Average(), 1)
                };
            })
            .OrderByDescending(x => x.DonDaXuLy)
            .ThenBy(x => x.HoTen)
            .Take(10)
            .ToList();
    }

    private static double? TinhTyLe(int hienTai, int kyTruoc)
    {
        if (kyTruoc == 0) return hienTai == 0 ? 0 : null;
        return Math.Round((hienTai - kyTruoc) * 100d / kyTruoc, 1);
    }
}
