using Application.Features.BaoCao.Queries.GetBaoCaoTuyenDung;
using Application.Features.DoanhNghiep.Queries.GetAllDoanhNghieps;
using Application.Features.NguoiDung.Commands.DeleteNguoiDung;
using Application.Features.NguoiDung.Commands.UpdateNguoiDung;
using Application.Features.NguoiDung.Queries.GetAllNguoiDungs;
using Application.Interfaces;
using AutoMapper;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

var options = new DbContextOptionsBuilder<ApplicationDbContext>()
    .UseInMemoryDatabase(Guid.NewGuid().ToString(), o => o.EnableNullChecks(false)).Options;
await using var db = new CheckContext(options, new Auth());
db.NguoiDungs.AddRange(
    new NguoiDung { Id = 1, ApplicationUserId = "candidate", VaiTro = VaiTroNguoiDung.UNG_VIEN },
    new NguoiDung { Id = 2, ApplicationUserId = "hr", VaiTro = VaiTroNguoiDung.NHAN_SU },
    new NguoiDung { Id = 3, ApplicationUserId = "owner", VaiTro = VaiTroNguoiDung.NGUOI_DAI_DIEN },
    new NguoiDung { Id = 4, ApplicationUserId = "empty", VaiTro = VaiTroNguoiDung.UNG_VIEN },
    new NguoiDung { Id = 5, ApplicationUserId = "importer", VaiTro = VaiTroNguoiDung.QUAN_TRI_VIEN });
db.CVImportSessions.Add(new CVImportSession { Id = Guid.NewGuid(), NguoiDungId = 5, HoSoUngVienId = 30 });
db.DoanhNghieps.AddRange(
    new DoanhNghiep { Id = 10, TenDoanhNghiep = "ACME", NguoiDaiDienId = 3 },
    new DoanhNghiep { Id = 11, TenDoanhNghiep = "Other" });
db.HoSoUngViens.Add(new HoSoUngVien { Id = 30, NguoiDungId = 1, HoTen = "Candidate" });
db.HoSoNhaTuyenDungs.AddRange(
    new HoSoNhaTuyenDung { Id = 20, NguoiDungId = 2, DoanhNghiepId = 10, HoTen = "Recruiter" },
    new HoSoNhaTuyenDung { Id = 21, NguoiDungId = 3, DoanhNghiepId = 10, HoTen = "Company Owner" });
db.TinTuyenDungs.AddRange(
    new TinTuyenDung { Id = 40, DoanhNghiepId = 10, NguoiDangTinId = 2, TieuDe = "Active", TrangThai = TrangThaiTinTuyenDung.DangTuyen },
    new TinTuyenDung { Id = 41, DoanhNghiepId = 11, NguoiDangTinId = 3, TieuDe = "Other", TrangThai = TrangThaiTinTuyenDung.DangTuyen },
    new TinTuyenDung { Id = 42, DoanhNghiepId = 10, NguoiDangTinId = 2, TieuDe = "Pending", TrangThai = TrangThaiTinTuyenDung.ChoAdminDuyet },
    new TinTuyenDung { Id = 43, DoanhNghiepId = 10, NguoiDangTinId = 2, TieuDe = "Draft", TrangThai = TrangThaiTinTuyenDung.Nhap });
var today = DateTime.UtcNow.Date;
db.DonUngTuyens.AddRange(
    new DonUngTuyen { Id = 50, TinTuyenDungId = 40, DoanhNghiepId = 10, CVUngVienId = 1, HoSoUngVienId = 30, NguoiXuLyId = 2, NgayUngTuyen = today.AddDays(-1) },
    new DonUngTuyen { Id = 51, TinTuyenDungId = 41, DoanhNghiepId = 11, CVUngVienId = 2, HoSoUngVienId = 30, NguoiXuLyId = 3, NgayUngTuyen = today });
await db.SaveChangesAsync();
var createdAt = new DateTime(2026, 1, 2, 3, 4, 5, DateTimeKind.Utc);
(await db.NguoiDungs.AsTracking().SingleAsync(x => x.Id == 4)).Created = createdAt;
await db.SaveChangesAsync();
db.ChangeTracker.Clear();

var mapper = new MapperConfiguration(c => {
    c.CreateMap<NguoiDung, GetAllNguoiDungsViewModel>();
    c.CreateMap<DoanhNghiep, GetAllDoanhNghiepsViewModel>();
}, NullLoggerFactory.Instance).CreateMapper();
var people = await new GetAllNguoiDungsQueryHandler(db, mapper).Handle(new(), default);
Check(people.Data.Single(x => x.Id == 4).Created == createdAt, "Admin person data keeps the profile creation date");
Check(people.Data.Single(x => x.Id == 1).HasRelatedData, "A candidate profile prevents hard deletion");
Check(people.Data.Single(x => x.Id == 2).HasRelatedData, "A recruiter with jobs/applications prevents hard deletion");
Check(people.Data.Single(x => x.Id == 3).HasRelatedData, "A company owner prevents hard deletion");
Check(people.Data.Single(x => x.Id == 5).HasRelatedData, "A CV import session prevents hard deletion");
Check(!people.Data.Single(x => x.Id == 4).HasRelatedData, "An unrelated empty profile remains deletable");

var deleted = await new DeleteNguoiDungCommandHandler(db).Handle(new() { Id = 1 }, default);
Check(!deleted.Succeeded, "Delete refuses a person with related recruitment data");
Check(await db.NguoiDungs.AnyAsync(x => x.Id == 1), "Refused deletion leaves the profile intact");

var deactivated = await new UpdateNguoiDungCommandHandler(db, new Current(), new Roles(db)).Handle(new()
{
    Id = 2,
    ApplicationUserId = "hr",
    VaiTro = VaiTroNguoiDung.NHAN_SU,
    IsActive = false,
}, default);
Check(deactivated.Succeeded, "Admin can deactivate a person instead of hard-deleting related data");
Check(!(await db.NguoiDungs.AsNoTracking().SingleAsync(x => x.Id == 2)).IsActive, "Deactivation persists on the domain profile");

var deletedEmpty = await new DeleteNguoiDungCommandHandler(db).Handle(new() { Id = 4 }, default);
Check(deletedEmpty.Succeeded, "Delete allows an unrelated empty profile");
Check(!(await db.NguoiDungs.AnyAsync(x => x.Id == 4)), "Successful deletion removes the empty profile");

var companies = await new GetAllDoanhNghiepsQueryHandler(db, mapper).Handle(new() { _start = 0, _end = 20 }, default);
var company = companies.Data.Single(x => x.Id == 10);
Check(company.TenNguoiDaiDien == "Company Owner", "Company list includes the representative name");
Check(company.SoTinDangTuyen == 1, "Company active-job count excludes pending and draft jobs");
Check(company.SoTinChoDuyet == 1, "Company pending-job count excludes drafts");
Check(company.SoDonUngTuyen == 1, "Company applicant count stays inside that company");
var secondCompanyPage = await new GetAllDoanhNghiepsQueryHandler(db, mapper).Handle(new() { _start = 1, _end = 2 }, default);
Check(secondCompanyPage.Data.Count == 1 && secondCompanyPage.Data[0].Id == 11, "Company pagination returns only the requested page");
Check(secondCompanyPage.Data[0].SoDonUngTuyen == 1, "Page-limited company aggregates stay scoped to the returned company");

var report = await new GetBaoCaoTuyenDungQueryHandler(db, new Current()).Handle(new() { KyNgay = 30 }, default);
Check(report.Data.XuHuong.Count == 30, "A 30-day report includes every calendar day");
Check(report.Data.XuHuong[0].Ngay == today.AddDays(-29).ToString("yyyy-MM-dd"), "The report starts at the first day of its range");
Check(report.Data.XuHuong[^1].Ngay == today.ToString("yyyy-MM-dd"), "The report ends today");
Check(report.Data.XuHuong.Count(x => x.SoLuong == 0) == 28, "Days without applications remain explicit zeroes");
Check(report.Data.XuHuong.Single(x => x.Ngay == today.AddDays(-1).ToString("yyyy-MM-dd")).SoLuong == 1, "Zero filling preserves real application counts");
Check(report.Data.XuHuong.Sum(x => x.SoLuong) == report.Data.LuotNop, "The trend total matches the report application total");

var allTime = await new GetBaoCaoTuyenDungQueryHandler(db, new Current()).Handle(new() { KyNgay = 0 }, default);
Check(allTime.Data.XuHuong.Count == 2 && allTime.Data.XuHuong[0].Ngay == today.AddDays(-1).ToString("yyyy-MM-dd"),
    "An all-time report spans from the first recorded application through today");
Console.WriteLine("PASS Admin management relations, safe deletion, company aggregates and complete report ranges");

static void Check(bool condition, string label)
{
    if (!condition) throw new Exception(label);
    Console.WriteLine("PASS " + label);
}

sealed class Auth : IAuthenticatedUserService { public string UserId { get; set; } = "admin"; }
sealed class Current : ICurrentNguoiDungService
{
    public Task<CurrentNguoiDungContext> ResolveAsync() => Task.FromResult(new CurrentNguoiDungContext
    {
        Id = 5,
        VaiTro = VaiTroNguoiDung.QUAN_TRI_VIEN
    });
}
sealed class Clock : IDateTimeService { public DateTime NowUtc => DateTime.UtcNow; public DateTime Now => DateTime.UtcNow; }
sealed class Roles(ApplicationDbContext db) : IUserRoleService
{
    public async Task SetRoleAsync(string applicationUserId, VaiTroNguoiDung role, bool? active = null, CancellationToken ct = default)
    {
        var profile = await db.NguoiDungs.AsTracking().SingleAsync(x => x.ApplicationUserId == applicationUserId, ct);
        profile.VaiTro = role;
        if (active.HasValue) profile.IsActive = active.Value;
        await db.SaveChangesAsync(ct);
    }

    public Task RemoveRoleAsync(string applicationUserId, string roleName, CancellationToken ct = default) =>
        throw new NotSupportedException();
}
sealed class CheckContext(DbContextOptions<ApplicationDbContext> options, IAuthenticatedUserService auth) : ApplicationDbContext(options, new Clock(), auth)
{
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.Entity<CvTheme>().Ignore(x => x.Embedding);
    }
}
