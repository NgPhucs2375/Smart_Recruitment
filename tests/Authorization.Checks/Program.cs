using Application.DTOs.CV;
using Application.Exceptions;
using Application.Interfaces;
using Application.Features.DanhGia.Queries.GetAllDanhGias;
using Application.Features.DanhGia.Queries.GetDanhGiaById;
using Application.Features.HoSoUngVien.Queries.GetHoSoUngVienById;
using Application.Features.HoSoUngVien.Queries.GetAllHoSoUngViens;
using Application.Features.KetQuaPhanTichCv.Commands.CreateKetQuaPhanTichCv;
using Application.Features.KetQuaPhanTichCv.Commands.UpdateKetQuaPhanTichCv;
using Application.Features.KetQuaPhanTichCv.Commands.DeleteKetQuaPhanTichCv;
using Application.Features.CVUngVien.Queries.GetCVUngVienById;
using Application.Features.CVUngVien.Queries.GetAllCVUngViens;
using Application.Features.CVUngVien.Cache;
using Application.Security;
using AutoMapper;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Identity.Contexts;
using Infrastructure.Identity.Models;
using Infrastructure.Identity.Seeds;
using Infrastructure.Identity.Services;
using Infrastructure.Persistence.Contexts;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Options;
using WebApp.Server.Services;
using System.Text.Json;

var checks = 0;
void Check(bool condition, string name) { if (!condition) throw new Exception(name); checks++; Console.WriteLine($"PASS {name}"); }
async Task Denied(Func<Task> action, string name, int status = 403)
{
    try { await action(); } catch (ApiException ex) when (ex.StatusCode == status) { Check(true, name); return; }
    throw new Exception($"Expected {status}: {name}");
}
await Denied(() => Task.Run(() => PermissionPolicy.Normalize("UNG_VIEN", "users", ["list"])), "Candidate cannot receive global Identity access", 400);
await Denied(() => Task.Run(() => PermissionPolicy.Normalize("NHAN_SU", "roleclaims", ["edit"])), "HR cannot receive permission administration", 400);
await Denied(() => Task.Run(() => PermissionPolicy.Normalize("UNG_VIEN", "danhgias", ["edit"])), "Candidate cannot grade their own applications", 400);
await Denied(() => Task.Run(() => PermissionPolicy.Normalize("UNG_VIEN", "cvungviens", ["show#edit"])), "Action delimiter injection rejected", 400);
await Denied(() => Task.Run(() => PermissionPolicy.Normalize("4", "cvungviens", ["show"])), "Numeric role aliases rejected", 400);
await Denied(() => Task.Run(() => PermissionPolicy.Normalize("QUAN_TRI_VIEN", "unknown\np,", ["list"])), "Unknown/CSV-injected resources rejected", 400);
var normalized = PermissionPolicy.Normalize("UNG_VIEN", " CVUngViens ", [" SHOW ", "show", "download"]);
Check(normalized.Resource == "cvungviens" && normalized.Actions.SequenceEqual(new[] { "download", "show" }), "Canonical, deduplicated grants");
Check(PermissionPolicy.AllowedActions("NHAN_SU", "chat").Contains("send") && !PermissionPolicy.IsEffective("UNG_VIEN", "chat", "send"), "Chat capabilities retain recruiter-only boundary");

var auth = new Auth { UserId = "candidate-a" };
using var db = new CheckContext(new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString(), o => o.EnableNullChecks(false)).Options, auth);
var users = new[] {
    new NguoiDung { Id = 1, ApplicationUserId = "candidate-a", VaiTro = VaiTroNguoiDung.UNG_VIEN, IsActive = true },
    new NguoiDung { Id = 2, ApplicationUserId = "candidate-b", VaiTro = VaiTroNguoiDung.UNG_VIEN, IsActive = true },
    new NguoiDung { Id = 3, ApplicationUserId = "hr-a", VaiTro = VaiTroNguoiDung.NHAN_SU, IsActive = true },
    new NguoiDung { Id = 4, ApplicationUserId = "hr-b", VaiTro = VaiTroNguoiDung.NHAN_SU, IsActive = true },
    new NguoiDung { Id = 5, ApplicationUserId = "owner", VaiTro = VaiTroNguoiDung.NGUOI_DAI_DIEN, IsActive = true }
};
db.NguoiDungs.AddRange(users);
db.DoanhNghieps.Add(new DoanhNghiep { Id = 31, NguoiDaiDienId = 5 });
db.HoSoNhaTuyenDungs.AddRange(new HoSoNhaTuyenDung { Id = 101, NguoiDungId = 1, DoanhNghiepId = 99 },
    new HoSoNhaTuyenDung { Id = 103, NguoiDungId = 3, DoanhNghiepId = 31 },
    new HoSoNhaTuyenDung { Id = 105, NguoiDungId = 5, DoanhNghiepId = 99 });
db.HoSoUngViens.AddRange(new HoSoUngVien { Id = 21, NguoiDungId = 1 }, new HoSoUngVien { Id = 22, NguoiDungId = 2 });
db.CVUngViens.AddRange(new CVUngVien { Id = 11, HoSoUngVienId = 21 }, new CVUngVien { Id = 12, HoSoUngVienId = 22 });
db.TinTuyenDungs.AddRange(new TinTuyenDung { Id = 41, DoanhNghiepId = 31, NguoiDangTinId = 3 }, new TinTuyenDung { Id = 42, DoanhNghiepId = 31, NguoiDangTinId = 4 });
db.DonUngTuyens.AddRange(new DonUngTuyen { Id = 51, CVUngVienId = 11, TinTuyenDungId = 41, CvSnapshotJson = JsonSerializer.Serialize(new CvDetailDto { Id = 11, TenFile = "Submitted snapshot" }) },
    new DonUngTuyen { Id = 52, CVUngVienId = 12, TinTuyenDungId = 42 });
db.DanhGias.AddRange(new DanhGia { Id = 61, DonUngTuyenId = 51 }, new DanhGia { Id = 62, DonUngTuyenId = 52 });
db.KetQuaPhanTichCvs.Add(new KetQuaPhanTichCv { Id = 71, CVUngVienId = 12 });
await db.SaveChangesAsync(); db.ChangeTracker.Clear();
var current = new Current { Value = new() { Id = 1, VaiTro = VaiTroNguoiDung.UNG_VIEN } };
var mapper = new MapperConfiguration(c => {
    c.CreateMap<DanhGia, GetAllDanhGiasViewModel>();
    c.CreateMap<HoSoUngVien, GetAllHoSoUngViensViewModel>();
}, NullLoggerFactory.Instance).CreateMapper();
Check((await new GetAllDanhGiasQueryHandler(db, mapper, current).Handle(new(), default)).Data.Select(x => x.Id).SequenceEqual([61]), "Candidate review list contains only their own application");
Check(!(await new GetDanhGiaByIdQueryHandler(db, mapper, current).Handle(new() { Id = 62 }, default)).Succeeded, "Candidate cannot guess another review ID");
await Denied(() => new CreateKetQuaPhanTichCvCommandHandler(db, current).Handle(new() { CVUngVienId = 12 }, default), "Foreign CV analysis cannot be created");
await Denied(() => new UpdateKetQuaPhanTichCvCommandHandler(db, current).Handle(new() { Id = 71, CVUngVienId = 11 }, default), "Foreign analysis cannot be moved onto an owned CV");
await Denied(() => new DeleteKetQuaPhanTichCvByIdCommandHandler(db, current).Handle(new() { Id = 71 }, default), "Foreign analysis cannot be deleted");
Check(await db.KetQuaPhanTichCvs.AnyAsync(x => x.Id == 71 && x.CVUngVienId == 12), "Denied writes leave foreign data intact");
var resolver = new CurrentNguoiDungService(auth, db);
Check((await resolver.ResolveAsync()).DoanhNghiepId == null, "Candidate ignores stale recruiter membership");
auth.UserId = "owner";
Check((await resolver.ResolveAsync()).DoanhNghiepId == 31, "Representative scope derives from ownership, not stale profile");
auth.UserId = "hr-a";
Check((await resolver.ResolveAsync()).DoanhNghiepId == 31, "HR retains current membership scope");
current.Value = new() { Id = 3, VaiTro = VaiTroNguoiDung.NHAN_SU, DoanhNghiepId = 31 };
Check((await ResourceAccess.ScopeReviews(db.DanhGias, current.Value).Select(x => x.Id).ToListAsync()).SequenceEqual([61]), "HR cannot read reviews of another HR's job in the same company");
await Denied(() => ResourceAccess.EnsureApplicationReviewerAsync(db, current.Value, 52, default), "HR cannot change another HR's review");
current.Value = new() { Id = 5, VaiTro = VaiTroNguoiDung.NGUOI_DAI_DIEN, DoanhNghiepId = 31 };
Check(await ResourceAccess.ScopeReviews(db.DanhGias, current.Value).CountAsync() == 2, "Representative can read company reviews");
current.Value = new() { Id = 6, VaiTro = VaiTroNguoiDung.QUAN_TRI_VIEN };
Check((await new GetHoSoUngVienByIdQueryHandler(db, mapper, current).Handle(new() { Id = 22 }, default)).Succeeded, "Admin is not incorrectly scoped as HR for candidate detail");

var cache = new MemoryDistributedCache(Options.Create(new MemoryDistributedCacheOptions()));
current.Value = new() { Id = 3, VaiTro = VaiTroNguoiDung.NHAN_SU, DoanhNghiepId = 31 };
var cvHandler = new GetCVUngVienByIdQueryHandler(db, current, null!, cache);
Check((await cvHandler.Handle(new() { Id = 11 }, default)).Data.TenFile == "Submitted snapshot", "Recruiter CV detail reads submitted snapshot, not current editor content");
Check(!(await cvHandler.Handle(new() { Id = 12 }, default)).Succeeded, "HR cannot read CV submitted to another HR's job");
await cache.SetStringAsync(CVUngVienListCache.BuildDetailKey(3, 12, "1"), JsonSerializer.Serialize(new Application.Wrappers.Response<CvDetailDto>(new CvDetailDto { Id = 12, TenFile = "Old privileged cache" })));
Check(!(await cvHandler.Handle(new() { Id = 12 }, default)).Succeeded, "Old cached CV content cannot bypass current object authorization");
var cvList = new GetAllCVUngViensQueryHandler(db, current, cache);
current.Value = new() { Id = 1, VaiTro = VaiTroNguoiDung.QUAN_TRI_VIEN };
Check((await cvList.Handle(new() { _end = 20 }, default)).Data.Count == 2, "Admin CV list can inspect all profiles");
current.Value = new() { Id = 1, VaiTro = VaiTroNguoiDung.UNG_VIEN };
Check((await cvList.Handle(new() { _end = 20 }, default)).Data.Select(x => x.Id).SequenceEqual([11]), "Admin-to-candidate role change cannot reuse privileged list cache");
var webAssembly = typeof(CurrentNguoiDungService).Assembly;
foreach (var spec in new[] {
    ("WebApp.Server.Agent.Adam.Tools.CvQueryTools", "GetCvDetailAsync", 4, new object[] { 11, CancellationToken.None }),
    ("WebApp.Server.Agent.RecommenAdam.Candidate.CandidateTools", "GetJobDetailsAsync", 3, new object[] { 41, CancellationToken.None }),
    ("WebApp.Server.Agent.RecommenAdam.Recruiter.Tools.RecruiterTools", "GetApplicationsAsync", 6, new object[] { (int?)41, 20, CancellationToken.None })
})
{
    var type = webAssembly.GetType(spec.Item1)!;
    var arguments = new object?[spec.Item3]; arguments[^1] = new DenyPermissions();
    var tools = Activator.CreateInstance(type, arguments)!;
    await Denied(async () => await (Task)type.GetMethod(spec.Item2)!.Invoke(tools, spec.Item4)!, $"AI tool {spec.Item2} cannot bypass withdrawn endpoint permission");
}

var temp = Path.Combine(Path.GetTempPath(), "opencode", "authorization-check-" + Guid.NewGuid().ToString("N"));
Directory.CreateDirectory(temp);
try
{
    await File.WriteAllTextAsync(Path.Combine(temp, "policy.csv"), "p, UNG_VIEN, cvungviens, show\np, QUAN_TRI_VIEN, roles, list\n");
    var services = new ServiceCollection(); services.AddLogging();
    services.AddDbContext<IdentityContext>(o => o.UseInMemoryDatabase(Guid.NewGuid().ToString()));
    services.AddIdentityCore<ApplicationUser>().AddRoles<IdentityRole>().AddEntityFrameworkStores<IdentityContext>();
    using var provider = services.BuildServiceProvider(); using var scope = provider.CreateScope();
    var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var identity = scope.ServiceProvider.GetRequiredService<IdentityContext>();
    await DefaultRoles.SeedAsync(manager, roleManager, temp);
    var role = (await roleManager.FindByNameAsync("UNG_VIEN"))!;
    Check((await roleManager.GetClaimsAsync(role)).Any(c => c.Value.Contains("download")), "Fresh-role bootstrap includes CV download");
    identity.RoleClaims.RemoveRange(await identity.RoleClaims.Where(c => c.RoleId == role.Id).ToListAsync()); await identity.SaveChangesAsync();
    await DefaultRoles.SeedAsync(manager, roleManager, temp);
    Check(!await identity.RoleClaims.AnyAsync(c => c.RoleId == role.Id), "Restart seeding preserves a fully revoked role");
    var claim = new IdentityRoleClaim<string> { RoleId = role.Id, ClaimType = "cvungviens", ClaimValue = "show" }; identity.RoleClaims.Add(claim);
    identity.Users.Add(new ApplicationUser { Id = "candidate-a", UserName = "a", EmailConfirmed = true });
    identity.UserRoles.Add(new IdentityUserRole<string> { UserId = "candidate-a", RoleId = role.Id }); await identity.SaveChangesAsync();
    auth.UserId = "candidate-a"; var permissions = new PermissionService(identity, auth);
    await permissions.RequireAsync("cvungviens", "show");
    claim.ClaimValue = ""; await identity.SaveChangesAsync();
    await Denied(() => permissions.RequireAsync("cvungviens", "show"), "Live permission service denies a withdrawn grant without JWT renewal");
    db.FailSave = true;
    try { await new UserRoleService(manager, roleManager, db).SetRoleAsync("candidate-a", VaiTroNguoiDung.QUAN_TRI_VIEN); throw new Exception("Expected simulated domain save failure"); }
    catch (InvalidOperationException ex) when (ex.Message == "Simulated domain save failure") { }
    finally { db.FailSave = false; }
    Check((await manager.GetRolesAsync((await manager.FindByIdAsync("candidate-a"))!)).SequenceEqual(["UNG_VIEN"]), "Failed domain save compensates Identity role changes");
    Check(identity.Model.FindEntityType(typeof(IdentityRoleClaim<string>))!.GetIndexes().Any(i => i.IsUnique && i.Properties.Select(p => p.Name).SequenceEqual(new[] { "RoleId", "ClaimType" })), "Database model enforces one grant per role/resource");
}
finally { Directory.Delete(temp, true); }
Console.WriteLine($"Completed {checks} authorization checks.");

sealed class Auth : IAuthenticatedUserService { public string UserId { get; set; } = ""; }
sealed class Clock : IDateTimeService { public DateTime NowUtc => DateTime.UtcNow; public DateTime Now => DateTime.UtcNow; }
sealed class Current : ICurrentNguoiDungService { public CurrentNguoiDungContext Value { get; set; } = new(); public Task<CurrentNguoiDungContext> ResolveAsync() => Task.FromResult(Value); }
sealed class DenyPermissions : IPermissionService { public Task RequireAsync(string resource, string action, CancellationToken cancellationToken = default) => throw new ApiException("Revoked", 403); }
sealed class CheckContext(DbContextOptions<ApplicationDbContext> options, IAuthenticatedUserService auth) : ApplicationDbContext(options, new Clock(), auth)
{
    public bool FailSave { get; set; }
    public override Task<int> SaveChangesAsync(CancellationToken ct = default) => FailSave ? throw new InvalidOperationException("Simulated domain save failure") : base.SaveChangesAsync(ct);
    protected override void OnModelCreating(ModelBuilder builder) { base.OnModelCreating(builder); builder.Entity<CvTheme>().Ignore(x => x.Embedding); }
}
