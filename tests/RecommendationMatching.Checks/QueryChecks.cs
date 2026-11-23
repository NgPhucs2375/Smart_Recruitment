using Application.Features.KetQuaPhuHop.Matching;
using Application.Features.KetQuaPhuHop.Queries.GetCvJobMatch;
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
        var javascript = new DanhMucKyNang { Id = 10, TenKyNang = "JavaScript" };
        var docker = new DanhMucKyNang { Id = 11, TenKyNang = "Docker" };
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
                new() { DanhMucKyNang = javascript, MucDoYeuCau = MucDoYC.BatBuc },
                new() { DanhMucKyNang = docker, MucDoYeuCau = MucDoYC.BatBuc }]
        };
        db.CVUngViens.AddRange(Cv(1, 1), Cv(2, 2, looking: false), Cv(3, 3, deleted: true));
        db.TinTuyenDungs.AddRange(Job(1, TrangThaiTinTuyenDung.DangTuyen),
            Job(2, TrangThaiTinTuyenDung.DaDong),
            Job(3, TrangThaiTinTuyenDung.DangTuyen, DateTime.UtcNow.AddDays(-1)));
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        var jobs = new GetSuggestedJobsForCvQueryHandler(db, current,
            NullLogger<GetSuggestedJobsForCvQueryHandler>.Instance, new StubReranker(null), cache);
        var request = new GetSuggestedJobsForCvQuery { TopN = 10 };
        var result = await jobs.Handle(request, default);
        check(result.Succeeded && result.Data.Count == 1 && result.Data[0].TinTuyenDungId == 1,
            "Job query excludes closed/expired postings");
        check(result.Data[0].KyNangThoa.SequenceEqual(["JavaScript"]) &&
            result.Data[0].KyNangThieu.SequenceEqual(["Docker"]), "Job response contains matched and missing skills");
        // 5/11 điểm kỹ năng (Bayes) trừ 0.05 vì thiếu Docker BatBuc.
        check(Math.Abs(result.Data[0].DiemPhuHop - .40454545f) < .00001f,
            "Job query uses normalized shared scorer with mandatory-skill penalty");
        check(result.Data[0].KyNangBatBuocThieu.SequenceEqual(["Docker"]), "Job query names the mandatory skill the CV lacks");
        var stored = await db.KetQuaPhuHops.SingleAsync();
        check(stored.MatchingVersion == ContentBasedMatcher.Version && stored.KyNangThoa == "JavaScript",
            "Persisted recommendation has scorer version and evidence");
        var cached = await jobs.Handle(request, default);
        check(cached.Data[0].KyNangThieu.SequenceEqual(["Docker"]) &&
            cached.Data[0].KyNangBatBuocThieu.SequenceEqual(["Docker"]),
            "Cached response preserves explanation fields");
        var unauthorizedCv = await jobs.Handle(new GetSuggestedJobsForCvQuery { CvUngVienId = 2 }, default);
        check(!unauthorizedCv.Succeeded, "Cannot recommend using another candidate's CV");

        current.Set(20, VaiTroNguoiDung.NHAN_SU, 10);
        var candidates = new GetSuggestedCandidatesForJobQueryHandler(db, current, new StubReranker(null), cache);
        var suggested = await candidates.Handle(new GetSuggestedCandidatesForJobQuery { TinTuyenDungId = 1 }, default);
        check(suggested.Succeeded && suggested.Data.Count == 1 && suggested.Data[0].CvUngVienId == 1,
            "Candidate query excludes deleted CVs and profiles not looking for work");
        check(suggested.Data[0].KyNangThoa.SequenceEqual(["JavaScript"]) &&
            Math.Abs(suggested.Data[0].DiemPhuHop - result.Data[0].DiemPhuHop) < .00001f,
            "Both recommendation directions produce consistent skill scores");
        check(suggested.Data[0].KyNangBatBuocThieu.SequenceEqual(["Docker"]),
            "Recruiter view sees the same mandatory gap as the candidate view");
        current.Set(21, VaiTroNguoiDung.NGUOI_DAI_DIEN, 99);
        check(!(await candidates.Handle(new GetSuggestedCandidatesForJobQuery { TinTuyenDungId = 1 }, default)).Succeeded,
            "Other company cannot access candidate recommendations, including cached results");
        current.Set(1, VaiTroNguoiDung.UNG_VIEN, null);
        check(!(await candidates.Handle(new GetSuggestedCandidatesForJobQuery { TinTuyenDungId = 1 }, default)).Succeeded,
            "Candidate role cannot use recruiter recommendations");

        // Điểm thành phần: fixture không có vị trí/lương/địa điểm/số năm nên
        // DiemPhuHop = DiemKyNang - PhatBatBuoc (thiếu Docker BatBuc).
        var vm = result.Data[0];
        check(Math.Abs(vm.DiemKyNang - (vm.DiemPhuHop + vm.PhatBatBuoc)) < .00001f &&
            Math.Abs(vm.PhatBatBuoc - .05f) < .00001f &&
            vm.BonusViTri == 0 && vm.BonusLuong == 0 && vm.BonusDiaDiem == 0 && vm.BonusKinhNghiem == 0,
            "Recommendation response exposes score components consistent with the final score");

        var pair = new GetCvJobMatchQueryHandler(db, current);
        var explicitMatch = await pair.Handle(new GetCvJobMatchQuery(1, 1), default);
        check(explicitMatch.Succeeded && explicitMatch.Data!.CvUngVienId == 1 &&
            Math.Abs(explicitMatch.Data.DiemKyNang - vm.DiemKyNang) < .00001f &&
            Math.Abs(explicitMatch.Data.DiemPhuHop - vm.DiemPhuHop) < .00001f &&
            explicitMatch.Data.MatchingVersion == ContentBasedMatcher.Version,
            "Single-pair match returns the same components as the recommendation list");
        check(await db.KetQuaPhuHops.CountAsync() == 1,
            "Single-pair match is read-only and does not persist KetQuaPhuHop");
        var defaultCvMatch = await pair.Handle(new GetCvJobMatchQuery(null, 1), default);
        check(defaultCvMatch.Succeeded && defaultCvMatch.Data!.CvUngVienId == 1,
            "Single-pair match falls back to the default CV when cvId is omitted");
        check(!(await pair.Handle(new GetCvJobMatchQuery(2, 1), default)).Succeeded,
            "Single-pair match rejects another candidate's CV");
        check(explicitMatch.Data.ThanhPhan.Count == 4 &&
            explicitMatch.Data.ThanhPhan.All(x => x.TrangThai is "thieuDuLieu" or "khongApDung") &&
            explicitMatch.Data.ThanhPhan.All(x => !string.IsNullOrWhiteSpace(x.GhiChu)),
            "Match components explain missing data instead of reporting a failed zero");

        // "Gần đủ nhất": hồ sơ đã có bằng chứng cho mọi kỹ năng bắt buộc xếp trên hồ sơ
        // thiếu 1 kỹ năng bắt buộc, kể cả khi hồ sơ thiếu có điểm thô cao hơn. Dựng DB
        // riêng để corpus IDF rỗng (một tin đang tuyển => idf 0 => trọng số 1), giữ phép
        // so sánh thuần luật.
        var sortOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString(), x => x.EnableNullChecks(false)).Options;
        await using var sortDb = new MatchingContext(sortOptions);
        var sortCompany = new DoanhNghiep { Id = 40, TenDoanhNghiep = "Sort check" };
        var sortJavaScript = new DanhMucKyNang { Id = 40, TenKyNang = "JavaScript" };
        var sortDocker = new DanhMucKyNang { Id = 41, TenKyNang = "Docker" };
        var preferred = new[] { "Kubernetes", "AWS", "GCP", "Terraform", "Figma", "Photoshop" }
            .Select((name, i) => new DanhMucKyNang { Id = 42 + i, TenKyNang = name }).ToList();
        CVUngVien SortCv(int id, params string[] skills) => new()
        {
            Id = id, TenFile = $"CV-{id}", IsDefault = true,
            HoSoUngVien = new HoSoUngVien
            {
                Id = id, NguoiDungId = id, HoTen = $"Candidate-{id}", IsTimViec = true,
                KinhNghiemLamViecs = new List<KinhNghiemLamViec>()
            },
            ThongTinLienHe = new CVThongTinLienHe { HoTen = $"Candidate-{id}" },
            KyNangs = skills.Select(x => new CVKyNang { TenKyNang = x }).ToList()
        };
        sortDb.TinTuyenDungs.Add(new TinTuyenDung
        {
            Id = 10, TieuDe = "Backend Developer", DoanhNghiep = sortCompany,
            TrangThai = TrangThaiTinTuyenDung.DangTuyen,
            KyNangTinTuyenDungs = [
                new() { DanhMucKyNang = sortJavaScript, MucDoYeuCau = MucDoYC.BatBuc },
                new() { DanhMucKyNang = sortDocker, MucDoYeuCau = MucDoYC.BatBuc },
                .. preferred.Select(x => new KyNangTinTuyenDung
                {
                    DanhMucKyNang = x, MucDoYeuCau = MucDoYC.UuTien
                })]
        });
        sortDb.CVUngViens.AddRange(
            // Đủ 2 kỹ năng bắt buộc nhưng trượt hết 6 kỹ năng ưu tiên: 8/23.
            SortCv(8, "JS", "Docker"),
            // Phủ cả 6 kỹ năng ưu tiên nhưng thiếu Docker: 0.60 - 0.05 = 0.55.
            SortCv(9, ["JS", .. preferred.Select(x => x.TenKyNang)]));
        await sortDb.SaveChangesAsync();
        sortDb.ChangeTracker.Clear();
        current.Set(40, VaiTroNguoiDung.NHAN_SU, 40);
        var sortHandler = new GetSuggestedCandidatesForJobQueryHandler(sortDb, current,
            new StubReranker(null), new MemoryDistributedCache(Options.Create(new MemoryDistributedCacheOptions())));
        var nearby = await sortHandler.Handle(new GetSuggestedCandidatesForJobQuery { TinTuyenDungId = 10 }, default);
        check(nearby.Succeeded && nearby.Data.Count == 2 &&
              nearby.Data[0].HoSoUngVienId == 8 && nearby.Data[0].KyNangBatBuocThieu.Count == 0 &&
              nearby.Data[1].HoSoUngVienId == 9 && nearby.Data[1].KyNangBatBuocThieu.SequenceEqual(["Docker"]) &&
              nearby.Data[1].DiemPhuHop > nearby.Data[0].DiemPhuHop,
            "Candidates covering every mandatory skill rank first even with a lower raw score");
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
