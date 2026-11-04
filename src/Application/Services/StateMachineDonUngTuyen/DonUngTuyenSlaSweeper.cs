using Application.DTOs.ThongBao;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Services.StateMachineDonUngTuyen;

/// <summary>Ngưỡng SLA do job đọc từ cấu hình; Application không tự quyết định mặc định.</summary>
public sealed record DonUngTuyenSlaOptions(
    int SoNgayChoXuLy,
    int SoNgayDaXem,
    int TyLeNhan,
    int SoLuongToiDaMoiLuot);

/// <summary>
/// Quét hồ sơ bị nhà tuyển dụng "ngâm" quá hạn rồi fire HetHanXuLy (system, bypass auth),
/// đồng thời nhắc người đăng tin một lần khi đạt % ngưỡng.
/// </summary>
public static class DonUngTuyenSlaSweeper
{
    /// <summary>
    /// Nhãn nhắc việc, cũng là khoá chống gửi trùng: cùng một đơn chỉ nhắc đúng một lần
    /// thay vì mỗi lượt quét lại gửi một tin.
    /// </summary>
    public const string TieuDeNhacViec = "Hồ sơ sắp quá hạn xử lý";

    /// <summary>
    /// Mốc tính SLA là thời điểm đơn BƯỚC VÀO trạng thái hiện tại, lấy từ dòng lịch sử
    /// cuối; không dùng LastModified vì cột đó bị đóng dấu ở mọi lần save nên chỉ cần HR
    /// mở form ghi chú là đồng hồ chạy lại từ đầu. Đơn chưa có dòng lịch sử nào thì tính
    /// từ ngày tạo.
    /// </summary>
    public static DateTime MocVaoTrangThai(DateTime ngayTao, DateTime? mocLichSuCuoiNhat) =>
        mocLichSuCuoiNhat ?? ngayTao;

    /// <summary>Số ngày phải xử lý trước khi đơn bị coi là quá hạn, theo trạng thái hiện tại.</summary>
    public static int SoNgayXuLy(TrangThaiDonUngTuyen trangThai, DonUngTuyenSlaOptions options) =>
        trangThai switch
        {
            TrangThaiDonUngTuyen.ChoXuLy => options.SoNgayChoXuLy,
            TrangThaiDonUngTuyen.DaXem => options.SoNgayDaXem,
            _ => 0
        };

    public static async Task<(int SoHetHan, int SoDaNac)> QuetAsync(
        IApplicationDbContext context,
        IDonUngTuyenWorkflowService workflow,
        ICurrentNguoiDungService current,
        INotificationService notifications,
        ILogger logger,
        DonUngTuyenSlaOptions options,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        // Chỉ quét đơn thuộc tin ĐANG tuyển: tin tạm dừng/đóng thì cascade
        // DongBoiTinTuyenDung (TinTuyenDungWorkflowService) mới là nhánh đúng nghiệp vụ,
        // không được phép biến đơn thành QuaHanXuLy.
        var danhSach = await context.DonUngTuyens
            .AsNoTracking()
            .Where(d => (d.TrangThai == TrangThaiDonUngTuyen.ChoXuLy || d.TrangThai == TrangThaiDonUngTuyen.DaXem)
                        && d.TinTuyenDung.TrangThai == TrangThaiTinTuyenDung.DangTuyen)
            .Select(d => new DonSla(d.Id, d.TrangThai, d.Created, d.TinTuyenDung.NguoiDangTinId))
            .ToListAsync(ct);
        if (danhSach.Count == 0) return (0, 0);

        var ids = danhSach.Select(x => x.Id).ToList();
        var mocLichSu = (await context.LichSuTrangThaiDonUngTuyens
            .AsNoTracking()
            .Where(h => ids.Contains(h.DonUngTuyenId))
            .Select(h => new { h.DonUngTuyenId, h.Created })
            .ToListAsync(ct))
            .GroupBy(h => h.DonUngTuyenId)
            .ToDictionary(g => g.Key, g => g.Max(h => h.Created));

        var hetHan = new List<DonSla>();
        var sapQuaHan = new List<(DonSla Don, int ConLai)>();
        foreach (var don in danhSach)
        {
            var soNgay = SoNgayXuLy(don.TrangThai, options);
            if (soNgay <= 0) continue;
            mocLichSu.TryGetValue(don.Id, out var mocCuoi);
            var tinhDen = MocVaoTrangThai(don.Created, mocCuoi).AddDays(soNgay);
            if (tinhDen <= now) hetHan.Add(don);
            else if (MocVaoTrangThai(don.Created, mocCuoi).AddDays(soNgay * options.TyLeNhan / 100.0) <= now)
                sapQuaHan.Add((don, Math.Max(0, (int)Math.Ceiling((tinhDen - now).TotalDays))));
        }

        var soDaNac = 0;
        var daNac = sapQuaHan.Count > 0
            ? await VanNhanDaNacAsync(context, sapQuaHan.Select(x => x.Don.Id).ToList(), ct)
            : new HashSet<int>();
        foreach (var (don, conLai) in sapQuaHan
                     .Where(x => !daNac.Contains(x.Don.Id) && x.Don.NguoiDangTinId > 0)
                     .OrderBy(x => x.ConLai)
                     .Take(options.SoLuongToiDaMoiLuot))
        {
            await notifications.SendToUserAsync(don.NguoiDangTinId, new ThongBaoDTO
            {
                TieuDe = TieuDeNhacViec,
                NoiDung = $"Hồ sơ #{don.Id} còn {conLai} ngày nữa là quá hạn xử lý. " +
                    "Xem và đánh giá để đơn không bị tự đóng.",
                LoaiThongBao = LoaiThongBao.DonUngTuyen,
                ReferenceType = nameof(DonUngTuyen),
                ReferenceId = don.Id
            });
            soDaNac++;
        }

        // AsTracking: DbContext đặt NoTracking toàn cục, state machine chỉ gán
        // _entity.TrangThai trong RAM nên không track thì SaveChanges không đổi trạng thái.
        var quaHan = hetHan.OrderBy(x => x.Id).Take(options.SoLuongToiDaMoiLuot).Select(x => x.Id).ToList();
        if (quaHan.Count == 0) return (0, soDaNac);

        var donQuaHan = await context.DonUngTuyens
            .AsTracking()
            .Include(d => d.TinTuyenDung)
            .Where(d => quaHan.Contains(d.Id))
            .ToListAsync(ct);

        foreach (var don in donQuaHan)
        {
            var soNgay = SoNgayXuLy(don.TrangThai, options);
            try
            {
                var machine = new DonUngTuyenStateMachine(workflow, current, context, don);
                await machine.FireSystemAsync(
                    TriggerDonUngTuyen.HetHanXuLy,
                    $"Nhà tuyển dụng không xử lý trong {soNgay} ngày (job SLA tự động).",
                    ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Không thể đánh dấu quá hạn đơn #{DonId}.", don.Id);
            }
        }

        await context.SaveChangesAsync(ct);
        return (donQuaHan.Count, soDaNac);
    }

    /// <summary>Những đơn đã từng được nhắc, nhận diện qua đúng nhãn nhắc việc.</summary>
    private static async Task<HashSet<int>> VanNhanDaNacAsync(
        IApplicationDbContext context, List<int> ids, CancellationToken ct)
    {
        var daGui = await context.Notifications
            .AsNoTracking()
            .Where(n => n.ReferenceType == nameof(DonUngTuyen)
                        && n.ReferenceId != null && ids.Contains(n.ReferenceId.Value)
                        && n.TieuDe == TieuDeNhacViec)
            .Select(n => n.ReferenceId!.Value)
            .ToListAsync(ct);
        return daGui.ToHashSet();
    }

    /// <summary>Ánh xạ tối giản từ bảng đơn + chủ tin, đủ để quyết định SLA.</summary>
    private sealed record DonSla(int Id, TrangThaiDonUngTuyen TrangThai, DateTime Created, int NguoiDangTinId);
}
