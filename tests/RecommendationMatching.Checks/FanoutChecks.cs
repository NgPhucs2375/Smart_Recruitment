using Application.DTOs.ThongBao;
using Application.Features.KetQuaPhuHop.Fanout;
using Application.Features.KetQuaPhuHop.Matching;
using Application.Features.KetQuaPhuHop.Queries.SuggestJobsForCv;
using Application.Interfaces.Repositories;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace RecommendationMatching.Checks;

public static class FanoutChecks
{
    public static async Task RunAsync(Action<bool, string> check)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString(), x => x.EnableNullChecks(false)).Options;
        await using var db = new MatchingContext(options);
        var recorder = new RecordingNotifications(db);
        var current = new MatchingUser();

        var company = new DoanhNghiep { Id = 10, TenDoanhNghiep = "Fanout check" };
        var javascript = new DanhMucKyNang { Id = 10, TenKyNang = "JavaScript" };
        var docker = new DanhMucKyNang { Id = 11, TenKyNang = "Docker" };
        var rust = new DanhMucKyNang { Id = 12, TenKyNang = "Rust" };
        // Kỹ năng ưu tiên không trùng ai trong pool: đủ nhiều để điểm tin 5 nằm dưới
        // mức TrungBinh bất kể corpus có áp IDF hay không (InMemory có thể không thấy
        // navigation, còn SQL thật thì có).
        var optional = new[]
            {
                "Kubernetes", "AWS", "GCP", "Terraform", "Figma", "Photoshop",
                "Kafka", "Elasticsearch"
            }
            .Select((name, i) => new DanhMucKyNang { Id = 13 + i, TenKyNang = name })
            .ToList();

        CVUngVien Cv(int id, int userId, params string[] skills) => new()
        {
            Id = id, TenFile = $"CV-{id}", IsDefault = true,
            HoSoUngVien = new HoSoUngVien
            {
                Id = id, NguoiDungId = userId, HoTen = $"Candidate-{id}", IsTimViec = true,
                KinhNghiemLamViecs = new List<KinhNghiemLamViec>()
            },
            ThongTinLienHe = new CVThongTinLienHe { HoTen = $"Candidate-{id}" },
            KyNangs = skills.Select(x => new CVKyNang { TenKyNang = x }).ToList()
        };
        TinTuyenDung Job(int id) => new()
        {
            Id = id, TieuDe = $"Frontend Developer {id}", DoanhNghiep = company, NguoiDangTinId = 100,
            TrangThai = TrangThaiTinTuyenDung.DangTuyen,
            // Tin 4 trùng địa điểm với hồ sơ 7 nhưng không trùng kỹ năng nào. Từ cbf-v8
            // thiếu 2 kỹ năng bắt buộc kéo điểm về 0, nên địa điểm không đủ cứu cặp
            // không có bằng chứng kỹ năng — hồ sơ 7 không còn được lưu.
            DiaDiemLamViec = id == 4 ? "Hà Nội" : null,
            KyNangTinTuyenDungs = id == 5
                ? [new() { DanhMucKyNang = rust, MucDoYeuCau = MucDoYC.BatBuc },
                    .. optional.Select(x => new KyNangTinTuyenDung
                    {
                        DanhMucKyNang = x, MucDoYeuCau = MucDoYC.UuTien
                    })]
                : [new() { DanhMucKyNang = javascript, MucDoYeuCau = MucDoYC.BatBuc },
                    new() { DanhMucKyNang = docker, MucDoYeuCau = MucDoYC.BatBuc }]
        };

        var chiHaNoi = Cv(7, 25, "Nursing");
        chiHaNoi.ThongTinLienHe.DiaChi = "Hà Nội";
        db.CVUngViens.AddRange(
            // Hồ sơ 1 khớp trọn 2 kỹ năng bắt buộc của tin 1-4, giữ mốc "%" ổn định
            // dù corpus có áp IDF hay không; vẫn dùng alias "JS" để phủ đường chuẩn hóa.
            Cv(1, 1, "JS", "Docker"),
            Cv(4, 22, "JavaScript", "Docker"),
            Cv(5, 23, "Vẽ kỹ thuật"),
            Cv(6, 26, "Rust"),
            chiHaNoi);
        db.TinTuyenDungs.AddRange(Job(1), Job(2), Job(3), Job(4), Job(5));
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        var fanout = new JobCandidateFanoutService(db, recorder,
            NullLogger<JobCandidateFanoutService>.Instance);
        var budget = new FanoutOptions
        {
            TopKPerJob = 20, TopJobsPerCandidate = 3, DailyNotifyBudgetPerCandidate = 3
        };
        foreach (var jobId in new[] { 1, 2, 3, 4, 5 })
            await fanout.RunAsync(jobId, budget);

        check(await db.KetQuaPhuHops.CountAsync() == 9,
            "Fan-out scores the whole looking pool for every live job");
        check(await db.KetQuaPhuHops.AnyAsync(k => k.CVUngVienId == 4),
            "Candidate who never opened the suggestion page already has a stored score");
        check(!await db.KetQuaPhuHops.AnyAsync(k => k.CVUngVienId == 5) &&
              !await db.KetQuaPhuHops.AnyAsync(k => k.CVUngVienId == 7),
            "Zero-score candidates are not stored (a location bonus alone cannot survive the mandatory gate)");
        check(await db.TinTuyenDungs.Where(x => x.NguoiDangTinId == 100)
                  .AllAsync(x => x.QuatUngVienLucCuoi != null),
            "Every swept job carries the sweep marker");

        // Top-3 mỗi ứng viên + ngân sách 3 bản tin/ngày: 4 tin đầu khớp nhau hoàn toàn
        // nên tin thứ 4 bị chặn bởi cả hai luật, trên cả hai ứng viên (3 + 3).
        // Hồ sơ 6 chỉ khớp tin 5 qua 1/9 yêu cầu (dưới ngưỡng TrungBinh) nên nhận đúng 1 tin.
        check(SentTo(recorder, "GoiYViecLamPhuHop") == 7,
            "Candidate notifications respect top jobs and the daily budget");
        check(SentTo(recorder, "UngVienPhuHop") == 5,
            "One aggregated recruiter digest per live job per day");
        // 5% nghe như lỗi hiển thị chứ không phải gợi ý: điểm dưới mức TrungBinh
        // phải diễn đạt bằng xếp hạng, điểm thật mới dán con số %. Hồ sơ 6 là ca thử.
        check(SentTo(recorder, "GoiYViecLamPhuHop", x => x.TieuDe.Contains('%')) == 6 &&
            SentTo(recorder, "GoiYViecLamPhuHop", x => !x.TieuDe.Contains('%')) == 1,
            "Low-score notification uses ranking wording instead of a misleading percentage");
        check(recorder.Sent.All(x => x.ReferenceType != "TinTuyenDung"),
            "Fan-out never writes the moderation reference type that HR reads as GhiChuKiemDuyet");

        var before = (await db.KetQuaPhuHops.CountAsync(), recorder.Sent.Count);
        foreach (var jobId in new[] { 1, 2, 3, 4, 5 })
            await fanout.RunAsync(jobId, budget);
        check(before == (await db.KetQuaPhuHops.CountAsync(), recorder.Sent.Count),
            "Re-running the sweep duplicates neither scores nor notifications");

        // Ứng viên CV1 lướt trang gợi ý với ngưỡng cao => danh sách trả về rỗng.
        // đường ghi cũ xoá sạch row của CV này; upsert thì không.
        current.Set(1, VaiTroNguoiDung.UNG_VIEN, null);
        var browse = new GetSuggestedJobsForCvQueryHandler(db, current,
            NullLogger<GetSuggestedJobsForCvQueryHandler>.Instance,
            new StubReranker(null),
            new MemoryDistributedCache(Options.Create(new MemoryDistributedCacheOptions())));
        var emptyPage = await browse.Handle(
            new GetSuggestedJobsForCvQuery { TopN = 10, MinimumScore = 0.99f }, default);
        check(emptyPage.Succeeded && emptyPage.Data.Count == 0,
            "High minimum score returns an empty suggestion page");
        check(await db.KetQuaPhuHops.CountAsync() == 9,
            "Browsing suggestions does not delete stored matches, including fan-out rows");

        // Tin 8 chỉ đòi Rust + Kafka: hồ sơ 6 có Rust nhưng thiếu Kafka, nên thông báo
        // phải nói thẳng "thiếu 1 kỹ năng bắt buộc" và digest HR phải tách số hồ sơ đã đủ.
        var kafka = new DanhMucKyNang { Id = 30, TenKyNang = "Kafka" };
        var trackedRust = await db.KyNangs.AsTracking().SingleAsync(x => x.Id == rust.Id);
        var trackedCompany = await db.DoanhNghieps.AsTracking().SingleAsync(x => x.Id == company.Id);
        db.KyNangs.Add(kafka);
        db.TinTuyenDungs.Add(new TinTuyenDung
        {
            Id = 8, TieuDe = "Kafka Engineer", DoanhNghiep = trackedCompany, NguoiDangTinId = 101,
            TrangThai = TrangThaiTinTuyenDung.DangTuyen,
            KyNangTinTuyenDungs = [
                new() { DanhMucKyNang = trackedRust, MucDoYeuCau = MucDoYC.BatBuc },
                new() { DanhMucKyNang = kafka, MucDoYeuCau = MucDoYC.BatBuc }]
        });
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();
        await fanout.RunAsync(8, budget);

        var gatedNotice = recorder.Sent.Single(x => x.ReferenceType == "GoiYViecLamPhuHop" &&
                                                   x.ReferenceId == 8);
        check(gatedNotice.NoiDung.Contains("Còn thiếu 1 kỹ năng bắt buộc: Kafka"),
            "Candidate digest names the missing mandatory skill and its count");
        var digest8 = recorder.Sent.Single(x => x.ReferenceType == "UngVienPhuHop" && x.ReferenceId == 8);
        check(digest8.NoiDung.Contains("trong đó 0 hồ sơ đã có bằng chứng cho mọi kỹ năng bắt buộc"),
            "Recruiter digest states how many candidates cover every mandatory skill");
        var digest1 = recorder.Sent.Single(x => x.ReferenceType == "UngVienPhuHop" && x.ReferenceId == 1);
        check(digest1.NoiDung.Contains("trong đó 2 hồ sơ đã có bằng chứng cho mọi kỹ năng bắt buộc"),
            "Recruiter digest counts fully qualified candidates");
    }

    private static int SentTo(RecordingNotifications recorder, string referenceType,
        Func<ThongBaoDTO, bool>? filter = null) =>
        recorder.Sent.Count(x => x.ReferenceType == referenceType && (filter == null || filter(x)));
}

/// <summary>Ghi thông báo vào đúng DbContext đang test để các bước chống trùng đọc lại thấy.</summary>
sealed class RecordingNotifications(ApplicationDbContext db) : INotificationService
{
    public List<ThongBaoDTO> Sent { get; } = [];

    public async Task SendToUserAsync(int userId, ThongBaoDTO notification)
    {
        Sent.Add(notification);
        db.Notifications.Add(new Notification
        {
            TieuDe = notification.TieuDe,
            NoiDung = notification.NoiDung,
            LoaiThongBao = notification.LoaiThongBao,
            ReferenceType = notification.ReferenceType,
            ReferenceId = notification.ReferenceId,
            Recipients = [new NotificationRecipient { NguoiDungId = userId }]
        });
        await db.SaveChangesAsync();
    }

    public Task SendToCompanyAsync(int companyId, ThongBaoDTO notification) => Task.CompletedTask;
    public Task SendToRoleAsync(string role, ThongBaoDTO notification) => Task.CompletedTask;
}
