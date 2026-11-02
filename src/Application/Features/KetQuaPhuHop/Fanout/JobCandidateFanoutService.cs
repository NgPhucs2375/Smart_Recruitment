using Application.DTOs.ThongBao;
using Application.Features.KetQuaPhuHop.Matching;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Features.KetQuaPhuHop.Fanout;

/// <summary>Ngân sách một lượt quét pool; host đọc appsettings rồi truyền vào, Application không biết cấu hình.</summary>
public sealed record FanoutOptions
{
    public int TopKPerJob { get; init; } = 20;
    public int TopJobsPerCandidate { get; init; } = 3;
    public int DailyNotifyBudgetPerCandidate { get; init; } = 3;
}

public sealed record FanoutOutcome(bool Skipped, int Persisted, int Notified, bool RecruiterDigestSent);

/// <summary>
/// Quét toàn bộ hồ sơ đang tìm việc khi một tin ở trạng thái ĐangTuyen: chấm điểm,
/// ghi vào kho KetQuaPhuHop cho cả hai phía, rồi báo ứng viên mà tin nằm trong
/// top các tin khớp nhất của chính họ và báo người đăng tin có bao nhiêu ứng viên.
/// Idempotent: upsert theo cặp + chống trùng thông báo nên chạy lại nhiều lần không nhân bản dữ liệu.
/// </summary>
public sealed class JobCandidateFanoutService(
    IApplicationDbContext context,
    INotificationService notifications,
    ILogger<JobCandidateFanoutService> logger)
{
    /// <summary>
    /// Không dùng nameof(TinTuyenDung): kiểu tham chiếu đó thuộc thông báo kiểm duyệt,
    /// và màn tin tuyển dụng phía HR đang lấy bản mới nhất để hiển thị làm GhiChuKiemDuyet.
    /// </summary>
    private const string ReferenceLoGoiY = "GoiYViecLamPhuHop";
    private const string ReferenceLoUngVienPhuHop = "UngVienPhuHop";

    public async Task<FanoutOutcome> RunAsync(
        int tinTuyenDungId, FanoutOptions options, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var today = now.Date;

        var job = await context.TinTuyenDungs
            .AsTracking()
            .Include(x => x.KyNangTinTuyenDungs).ThenInclude(x => x.DanhMucKyNang)
            .FirstOrDefaultAsync(x => x.Id == tinTuyenDungId &&
                                      x.TrangThai == TrangThaiTinTuyenDung.DangTuyen &&
                                      (x.NgayHetHan == null || x.NgayHetHan > now), ct);
        if (job == null)
            return new FanoutOutcome(true, 0, 0, false);

        var requirements = job.KyNangTinTuyenDungs
            .Where(x => x.DanhMucKyNang != null && !string.IsNullOrWhiteSpace(x.DanhMucKyNang.TenKyNang))
            .Select(x => new MatchRequirement(x.KyNangId, x.DanhMucKyNang.TenKyNang, x.MucDoYeuCau))
            .ToList();
        var jobInput = new JobMatchInput(requirements, job.TieuDe,
            job.LuongToiThieu, job.LuongToiDa, job.DiaDiemLamViec);

        // Cùng định nghĩa pool với truy vấn "ứng viên cho tin": CV mặc định, chưa xoá, hồ sơ đang mở tìm việc.
        var pool = (await context.CVUngViens
            .AsNoTracking()
            .AsSplitQuery()
            .Include(x => x.ThongTinLienHe)
            .Include(x => x.KyNangs)
            .Include(x => x.HoSoUngVien)
            .Where(x => x.IsDefault && !x.IsDaXoa && x.HoSoUngVien.IsTimViec)
            .ToListAsync(ct))
            .Select(cv => new PoolUngVien
            {
                CvUngVienId = cv.Id,
                HoSoUngVienId = cv.HoSoUngVienId,
                NguoiDungId = cv.HoSoUngVien.NguoiDungId,
                HoTen = cv.ThongTinLienHe?.HoTen ?? cv.HoSoUngVien.HoTen,
                ViTriUngTuyen = !string.IsNullOrWhiteSpace(cv.ThongTinLienHe?.ViTriUngTuyen)
                    ? cv.ThongTinLienHe!.ViTriUngTuyen : cv.HoSoUngVien.ViTriUngTuyen,
                MucLuongMongMuon = cv.ThongTinLienHe?.MucLuongMongMuon ?? (decimal)cv.HoSoUngVien.MucLuongMongMuon,
                DiaChi = !string.IsNullOrWhiteSpace(cv.ThongTinLienHe?.DiaChi)
                    ? cv.ThongTinLienHe!.DiaChi : cv.HoSoUngVien.DiaChi,
                KyNangs = cv.KyNangs.Select(k => new MatchSkill(k.KyNangId, k.TenKyNang)).ToList(),
            })
            .ToList();

        var ranked = pool
            .Select(c => (Candidate: c, Match: ContentBasedMatcher.Evaluate(new CandidateMatchInput(
                c.KyNangs, c.ViTriUngTuyen,
                c.MucLuongMongMuon ?? 0, c.DiaChi), jobInput)))
            .Where(x => x.Match.Score > 0f)
            .OrderByDescending(x => x.Match.Score)
            .ThenBy(x => x.Candidate.HoTen)
            .Take(Math.Clamp(options.TopKPerJob, 1, 100))
            .ToList();

        foreach (var (candidate, match) in ranked)
            await KetQuaPhuHopStore.UpsertAsync(context, candidate.HoSoUngVienId, candidate.CvUngVienId,
                job.Id, match, "Quét pool ứng viên khi tin đang tuyển.",
                "skill-overlap-weighted-normalized", ct);
        await context.SaveChangesAsync(ct);

        var notified = await NotifyCandidatesAsync(job, ranked, today, now, options, ct);
        var recruiterDigestSent = await NotifyRecruiterAsync(job, ranked.Count, today, ct);

        // Đóng dấu sau cùng: nếu crash ở bước thông báo thì dấu vẫn null
        // và lượt sau quét lại; chống trùng nằm ở unique index + kiểm tra Notification.
        job.QuatUngVienLucCuoi = now;
        await context.SaveChangesAsync(ct);

        logger.LogInformation("Fan-out tin #{TinId}: {Persisted} ứng viên lưu điểm, {Notified} được báo, digest NTĐ={Digest}.",
            job.Id, ranked.Count, notified, recruiterDigestSent);

        return new FanoutOutcome(false, ranked.Count, notified, recruiterDigestSent);
    }

    private async Task<int> NotifyCandidatesAsync(
        Domain.Entities.TinTuyenDung job,
        List<(PoolUngVien Candidate, ContentMatchResult Match)> ranked,
        DateTime today,
        DateTime now,
        FanoutOptions options,
        CancellationToken ct)
    {
        if (options.TopJobsPerCandidate <= 0 || ranked.Count == 0)
            return 0;

        var hoSoIds = ranked.Select(x => x.Candidate.HoSoUngVienId).ToList();
        var topRows = await context.KetQuaPhuHops
            .AsNoTracking()
            .Where(k => hoSoIds.Contains(k.HoSoUngVienId) &&
                        k.TinTuyenDung.TrangThai == TrangThaiTinTuyenDung.DangTuyen &&
                        (k.TinTuyenDung.NgayHetHan == null || k.TinTuyenDung.NgayHetHan > now))
            .Select(k => new { k.HoSoUngVienId, k.TinTuyenDungId, k.DiemPhuHop })
            .ToListAsync(ct);

        // Tin này chỉ đáng báo nếu nó nằm trong những tin khớp nhất của chính ứng viên,
        // để họ không nhận tin cho từng tin hệ thống tìm ra.
        var tinTotNhatCuaHoSo = topRows
            .GroupBy(r => r.HoSoUngVienId)
            .ToDictionary(g => g.Key, g => g
                .OrderByDescending(r => r.DiemPhuHop)
                .ThenByDescending(r => r.TinTuyenDungId)
                .Take(options.TopJobsPerCandidate)
                .Select(r => r.TinTuyenDungId)
                .ToHashSet());

        var sent = 0;
        foreach (var (candidate, match) in ranked)
        {
            if (candidate.NguoiDungId <= 0)
                continue;
            if (!tinTotNhatCuaHoSo.TryGetValue(candidate.HoSoUngVienId, out var bestJobs) ||
                !bestJobs.Contains(job.Id))
                continue;

            var userId = candidate.NguoiDungId;
            var daBaoTinNayHomNay = await context.Notifications
                .AnyAsync(n => n.Created >= today && n.ReferenceType == ReferenceLoGoiY &&
                               n.ReferenceId == job.Id &&
                               n.Recipients.Any(r => r.NguoiDungId == userId), ct);
            if (daBaoTinNayHomNay)
                continue;

            var daNhanHomNay = await context.Notifications
                .CountAsync(n => n.Created >= today && n.ReferenceType == ReferenceLoGoiY &&
                                  n.Recipients.Any(r => r.NguoiDungId == userId), ct);
            if (daNhanHomNay >= options.DailyNotifyBudgetPerCandidate)
                continue;

            var pct = (int)Math.Round(match.Score * 100f);
            try
            {
                await notifications.SendToUserAsync(userId, new ThongBaoDTO
                {
                    // Điểm chỉ đáng nêu khi đủ cao để đọc thành con số; dưới mức TrungBinh
                    // thì mô tả bằng xếp hạng, tránh viết "phù hợp 5%".
                    TieuDe = match.Score >= 0.33f
                        ? $"{job.TieuDe} — phù hợp {pct}% với CV của bạn"
                        : $"{job.TieuDe} — tin khớp nhất với CV của bạn",
                    NoiDung = NoiDungUngVien(match, job),
                    LoaiThongBao = LoaiThongBao.ViecLamMoi,
                    ReferenceType = ReferenceLoGoiY,
                    ReferenceId = job.Id,
                });
                sent++;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Không gửi được thông báo gợi ý cho user #{UserId} của tin #{TinId}.",
                    userId, job.Id);
            }
        }
        return sent;
    }

    private async Task<bool> NotifyRecruiterAsync(
        Domain.Entities.TinTuyenDung job, int soUngVien, DateTime today, CancellationToken ct)
    {
        if (soUngVien <= 0 || job.NguoiDangTinId <= 0)
            return false;

        var daGuiHomNay = await context.Notifications
            .AnyAsync(n => n.Created >= today && n.ReferenceType == ReferenceLoUngVienPhuHop &&
                           n.ReferenceId == job.Id, ct);
        if (daGuiHomNay)
            return false;

        try
        {
            await notifications.SendToUserAsync(job.NguoiDangTinId, new ThongBaoDTO
            {
                TieuDe = $"{job.TieuDe} — {soUngVien} ứng viên khớp nhất",
                NoiDung = $"Hệ thống tìm thấy {soUngVien} hồ sơ đang tìm việc khớp với tin này. " +
                          "Mở danh sách ứng viên để xem ai khớp ở điểm nào.",
                LoaiThongBao = LoaiThongBao.DonUngTuyen,
                ReferenceType = ReferenceLoUngVienPhuHop,
                ReferenceId = job.Id,
            });
            return true;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Không gửi được bản tin ứng viên cho HR của tin #{TinId}.", job.Id);
            return false;
        }
    }

    private static string NoiDungUngVien(ContentMatchResult match, Domain.Entities.TinTuyenDung job)
    {
        var parts = new List<string>();
        if (match.MatchedSkills.Count > 0)
            parts.Add($"Kỹ năng khớp: {string.Join(", ", match.MatchedSkills.Take(3))}.");
        if (match.MissingSkills.Count > 0)
            parts.Add($"Còn thiếu: {string.Join(", ", match.MissingSkills.Take(3))}.");
        parts.Add($"Mức lương: {(job.LuongToiDa > 0 ? $"{job.LuongToiThieu:N0} - {job.LuongToiDa:N0}" : "thỏa thuận")}.");
        if (!string.IsNullOrWhiteSpace(job.DiaDiemLamViec))
            parts.Add($"Địa điểm: {job.DiaDiemLamViec}.");
        return string.Join(" ", parts);
    }

    public sealed class PoolUngVien
    {
        public int CvUngVienId { get; set; }
        public int HoSoUngVienId { get; set; }
        public int NguoiDungId { get; set; }
        public string HoTen { get; set; }
        public string ViTriUngTuyen { get; set; }
        public decimal? MucLuongMongMuon { get; set; }
        public string DiaChi { get; set; }
        public List<MatchSkill> KyNangs { get; set; } = [];
    }
}
