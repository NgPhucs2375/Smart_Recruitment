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

public static class QueryChecks
{
    public static async Task RunAsync(Action<bool, string> check)
    {
        // Minimal graphs exercise query logic; relational/schema validation belongs to DB tests.
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString(), x => x.EnableNullChecks(false)).Options;
        await using var db = new MatchingContext(options);
        var cache = new MemoryDistributedCache(Options.Create(new MemoryDistributedCacheOptions()));
        var current = new MatchingUser();
        var company = new DoanhNghiep { Id = 10, TenDoanhNghiep = "Matching check" };
        var javascript = new KyNang { Id = 10, TenKyNang = "JavaScript" };
        var docker = new KyNang { Id = 11, TenKyNang = "Docker" };
        CVUngVien Cv(int id, int userId, bool looking = true, bool deleted = false) => new()
        {
            Id = id, TenFile = $"CV-{id}", IsDefault = true, IsDaXoa = deleted,
            HoSoUngVien = new HoSoUngVien
            {
                Id = id, NguoiDungId = userId, HoTen = $"Candidate-{id}", IsTimViec = looking,
                KinhNghiemLamViecs = new List<KinhNghiemLamViec>()
            },
            ThongTinLienHe = new CVThongTinLienHe { HoTen = $"Candidate-{id}" },
            KyNangs = [new CVKyNang { TenKyNang = "JS" }]
        };
        TinTuyenDung Job(int id, TrangThaiTinTuyenDung state, DateTime? deadline = null) => new()
        {
            Id = id, TieuDe = "Frontend Developer", DoanhNghiep = company,
            TrangThai = state, NgayHetHan = deadline,
            KyNangTinTuyenDungs = [
                new() { KyNang = javascript, MucDoYeuCau = MucDoYC.BatBuc },
                new() { KyNang = docker, MucDoYeuCau = MucDoYC.BatBuc }]
        };
        db.CVUngViens.AddRange(Cv(1, 1), Cv(2, 2, looking: false), Cv(3, 3, deleted: true));
        db.TinTuyenDungs.AddRange(Job(1, TrangThaiTinTuyenDung.DangTuyen),
            Job(2, TrangThaiTinTuyenDung.DaDong),
            Job(3, TrangThaiTinTuyenDung.DangTuyen, DateTime.UtcNow.AddDays(-1)));
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        var jobs = new GetSuggestedJobsForCvQueryHandler(db, current,
            NullLogger<GetSuggestedJobsForCvQueryHandler>.Instance, cache);
        var request = new GetSuggestedJobsForCvQuery { TopN = 10 };
        var result = await jobs.Handle(request, default);
        check(result.Succeeded && result.Data.Count == 1 && result.Data[0].TinTuyenDungId == 1,
            "Job query excludes closed/expired postings");
        check(result.Data[0].KyNangThoa.SequenceEqual(["JavaScript"]) &&
            result.Data[0].KyNangThieu.SequenceEqual(["Docker"]), "Job response contains matched and missing skills");
        check(Math.Abs(result.Data[0].DiemPhuHop - .5f) < .00001f, "Job query uses normalized shared scorer");
        var stored = await db.KetQuaPhuHops.SingleAsync();
        check(stored.MatchingVersion == ContentBasedMatcher.Version && stored.KyNangThoa == "JavaScript",
            "Persisted recommendation has scorer version and evidence");
        var cached = await jobs.Handle(request, default);
        check(cached.Data[0].KyNangThieu.SequenceEqual(["Docker"]), "Cached response preserves explanation fields");
        var unauthorizedCv = await jobs.Handle(new GetSuggestedJobsForCvQuery { CvUngVienId = 2 }, default);
        check(!unauthorizedCv.Succeeded, "Cannot recommend using another candidate's CV");

        current.Set(20, VaiTroNguoiDung.NHAN_SU, 10);
        var candidates = new GetSuggestedCandidatesForJobQueryHandler(db, current, cache);
        var suggested = await candidates.Handle(new GetSuggestedCandidatesForJobQuery { TinTuyenDungId = 1 }, default);
        check(suggested.Succeeded && suggested.Data.Count == 1 && suggested.Data[0].CvUngVienId == 1,
            "Candidate query excludes deleted CVs and profiles not looking for work");
        check(suggested.Data[0].KyNangThoa.SequenceEqual(["JavaScript"]) &&
            Math.Abs(suggested.Data[0].DiemPhuHop - result.Data[0].DiemPhuHop) < .00001f,
            "Both recommendation directions produce consistent skill scores");
        current.Set(21, VaiTroNguoiDung.NGUOI_DAI_DIEN, 99);
        check(!(await candidates.Handle(new GetSuggestedCandidatesForJobQuery { TinTuyenDungId = 1 }, default)).Succeeded,
            "Other company cannot access candidate recommendations, including cached results");
        current.Set(1, VaiTroNguoiDung.UNG_VIEN, null);
        check(!(await candidates.Handle(new GetSuggestedCandidatesForJobQuery { TinTuyenDungId = 1 }, default)).Succeeded,
            "Candidate role cannot use recruiter recommendations");
    }
}

sealed class MatchingContext(DbContextOptions<ApplicationDbContext> options)
    : ApplicationDbContext(options, new MatchingClock(), new MatchingAuth())
{
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.Entity<CvTheme>().Ignore(x => x.Embedding);
    }
}
sealed class MatchingClock : IDateTimeService
{
    public DateTime NowUtc => DateTime.UtcNow;
    public DateTime Now => NowUtc;
}
sealed class MatchingAuth : IAuthenticatedUserService { public string UserId => "matching-check"; }
sealed class MatchingUser : ICurrentNguoiDungService
{
    private CurrentNguoiDungContext _user = new() { Id = 1, VaiTro = VaiTroNguoiDung.UNG_VIEN };
    public void Set(int id, VaiTroNguoiDung role, int? company) =>
        _user = new() { Id = id, VaiTro = role, DoanhNghiepId = company };
    public Task<CurrentNguoiDungContext> ResolveAsync() => Task.FromResult(_user);
}
