using Application.Features.KetQuaPhuHop.Matching;
using Application.Features.KetQuaPhuHop.Queries.SuggestCandidatesForJob;
using Application.Features.KetQuaPhuHop.Queries.SuggestJobsForCv;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace RecommendationMatching.Checks;

/// <summary>Reranker giả lập: trả đúng kết quả DeepSeek sẽ trả, hoặc null khi tắt/lỗi.</summary>
sealed class StubReranker(RerankResult? result) : IRecommendationReranker
{
    public Task<RerankResult?> RerankAsync(
        string context,
        IReadOnlyList<RerankItem> items,
        CancellationToken cancellationToken = default) => Task.FromResult(result);
}

// DeepSeek chỉ xếp lại thứ tự và viết lý do: điểm luật, bản ghi KetQuaPhuHop và
// số lượng kết quả phải còn nguyên khi mô hình tắt, nói sai hoặc trả id lạ.
public static class RerankChecks
{
    public static async Task RunAsync(Action<bool, string> check)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString(), x => x.EnableNullChecks(false)).Options;
        await using var db = new MatchingContext(options);
        var company = new DoanhNghiep { Id = 10, TenDoanhNghiep = "Rerank check" };
        var javascript = new DanhMucKyNang { Id = 10, TenKyNang = "JavaScript" };

        TinTuyenDung Job(int id, string title) => new()
        {
            Id = id, TieuDe = title, DoanhNghiep = company,
            TrangThai = TrangThaiTinTuyenDung.DangTuyen,
            KyNangTinTuyenDungs = [
                new() { DanhMucKyNang = javascript, MucDoYeuCau = MucDoYC.BatBuc }]
        };

        db.CVUngViens.Add(new CVUngVien
        {
            Id = 1, TenFile = "CV-1", IsDefault = true,
            HoSoUngVien = new HoSoUngVien
            {
                Id = 1, NguoiDungId = 1, HoTen = "Candidate-1", IsTimViec = true,
                KinhNghiemLamViecs = new List<KinhNghiemLamViec>()
            },
            ThongTinLienHe = new CVThongTinLienHe { HoTen = "Candidate-1" },
            KyNangs = [new CVKyNang { TenKyNang = "JS" }]
        });
        // Hai tin cùng đòi JavaScript bắt buộc => điểm luật bằng nhau, nên thứ tự
        // deterministic chỉ phân biệt bởi id giảm dần. Rerank đổi được thứ tự là thật đổi.
        db.TinTuyenDungs.AddRange(Job(1, "Backend .NET"), Job(2, "Fullstack Vue"));
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        var current = new MatchingUser();
        IDistributedCache NewCache() =>
            new MemoryDistributedCache(Options.Create(new MemoryDistributedCacheOptions()));

        var jobsHandler = new GetSuggestedJobsForCvQueryHandler(
            db, current, NullLogger<GetSuggestedJobsForCvQueryHandler>.Instance,
            new StubReranker(null), NewCache());
        var kept = await jobsHandler.Handle(new GetSuggestedJobsForCvQuery { TopN = 10 }, default);
        check(kept.Succeeded && kept.Data.Select(x => x.TinTuyenDungId).SequenceEqual([2, 1]),
            "Rerank off keeps content-based order");
        check(kept.Data.All(x => x.LyDoGoiY is null), "Rerank off adds no AI reason");

        var reordered = new GetSuggestedJobsForCvQueryHandler(
            db, current, NullLogger<GetSuggestedJobsForCvQueryHandler>.Instance,
            new StubReranker(new RerankResult([1, 2],
                new Dictionary<int, string>
                {
                    [1] = "Kỹ năng trùng đúng nhóm backend.",
                    [2] = "Trùng JavaScript nhưng thiên frontend."
                })),
            NewCache());
        var moved = await reordered.Handle(new GetSuggestedJobsForCvQuery { TopN = 10 }, default);
        check(moved.Data.Select(x => x.TinTuyenDungId).SequenceEqual([1, 2]),
            "Rerank result reorders the page");
        check(moved.Data[0].LyDoGoiY == "Kỹ năng trùng đúng nhóm backend.",
            "AI reason attached to re-ranked posting");
        // Muc tiep cua check nay la DiemPhuHop KHONG doi sau rerank, khong phai gia tri
        // cu the, nen so sanh voi chinh scorer thay vi hard-code diem cua mot phien ban.
        var ruleScore = ContentBasedMatcher.Evaluate(
            new CandidateMatchInput([new MatchSkill(null, "JS")]),
            new JobMatchInput([new MatchRequirement(null, "JavaScript", MucDoYC.BatBuc)])).Score;
        check(moved.Data.All(x => Math.Abs(x.DiemPhuHop - ruleScore) < 0.00001f),
            "Rerank never changes the rule score");

        var bogus = new GetSuggestedJobsForCvQueryHandler(
            db, current, NullLogger<GetSuggestedJobsForCvQueryHandler>.Instance,
            new StubReranker(new RerankResult([2, 99],
                new Dictionary<int, string> { [2] = "Tin này khớp nhất." })),
            NewCache());
        var repaired = await bogus.Handle(new GetSuggestedJobsForCvQuery { TopN = 10 }, default);
        check(repaired.Data.Count == 2
            && repaired.Data[0].TinTuyenDungId == 2
            && repaired.Data[1].TinTuyenDungId == 1,
            "Unknown id is dropped and the missed posting is appended, never lost");
        check(repaired.Data[1].LyDoGoiY is null, "Posting the model skipped keeps a null reason");

        current.Set(20, VaiTroNguoiDung.NHAN_SU, 10);
        var recruiterHandler = new GetSuggestedCandidatesForJobQueryHandler(
            db, current,
            new StubReranker(new RerankResult([1],
                new Dictionary<int, string> { [1] = "Đúng nhóm kỹ năng tin đang thiếu." })),
            NewCache());
        var forJob = await recruiterHandler.Handle(
            new GetSuggestedCandidatesForJobQuery { TinTuyenDungId = 1 }, default);
        check(forJob.Succeeded && forJob.Data.Count == 1
            && forJob.Data[0].LyDoGoiY == "Đúng nhóm kỹ năng tin đang thiếu.",
            "Candidate direction attaches AI reason to the suggested profile");
        check(forJob.Data[0].HoTen == "Candidate-1",
            "Candidate name still comes from the database, not from the model");

        check((await db.KetQuaPhuHops.CountAsync()) > 0
            && (await db.KetQuaPhuHops.CountAsync(x => x.MatchingVersion == ContentBasedMatcher.Version))
            == await db.KetQuaPhuHops.CountAsync(),
            "Stored match rows keep the deterministic scorer version");
    }
}
