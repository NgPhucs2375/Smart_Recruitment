using Application.Exceptions;
using Application.Features.CvTheme.Queries.SuggestCvThemes;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using System.Reflection;

int checks = 0;
void Check(bool condition, string name) { if (!condition) throw new Exception(name); checks++; Console.WriteLine("PASS " + name); }
async Task Reject(Func<Task> action, int status, string name) { try { await action(); } catch (ApiException e) when (e.StatusCode == status) { Check(true, name); return; } throw new Exception(name); }
CvTheme Theme(int id, string slug, string industry, string position, string level = "all", string style = "modern", bool ats = true, bool active = true) => new() {
    Id = id, Slug = slug, Ten = slug, NganhPhuHop = industry, ViTriMucTieu = position, CapBac = level,
    PhongCachThietKe = style, ThanThienATS = ats, IsActive = active, SoCot = CvThemeMatcher.Renderers.GetValueOrDefault(slug)?.Columns ?? 1, ThuTu = id
};
var themes = new[] {
    Theme(101, "minimal-ats", "all", "all", style:"ats"),
    Theme(102, "ats-classic", "IT", "Backend,DevOps", "junior,mid", "classic"),
    Theme(103, "executive-tech", "IT", "Backend,Lead", "senior,lead"),
    Theme(104, "care-plus", "Y tế", "Bác sĩ,Điều dưỡng"),
    Theme(105, "vault-finance", "Tài chính,Ngân hàng", "Finance,Accountant", "senior"),
    Theme(106, "creative-portfolio", "Thiết kế", "Designer,UI,UX", style:"creative", ats:false),
    Theme(107, "tech-modern", "IT", "Backend", "all"),
    Theme(108, "not-a-renderer", "IT", "Backend", "junior"),
    Theme(109, "devops-stack", "IT", "DevOps", active:false)
};
var junior = new GetSuggestedCvThemesQuery { ViTri = "Backend Developer", Nganh = "IT", CapBac = "junior", PhongCach = "tối giản", SoCot = 1, BatBuocATS = true };
var result = CvThemeMatcher.Rank(themes, junior, junior.ViTri!, []);
Check(result.First().Slug == "ats-classic", "Backend junior + one-column/minimal/ATS ranks relevant technical template");
Check(result.All(x => x.Slug != "executive-tech" && x.SoCot == 1 && x.ThanThienATS), "Level and required layout/ATS constraints are not relaxed");
Check(result.All(x => x.Slug != "not-a-renderer" && x.Slug != "devops-stack"), "Unknown/inactive templates are never recommended");
Check(result.All(x => x.MatchingVersion == "theme-v2" && !string.IsNullOrWhiteSpace(x.LyDo) && CvThemeMatcher.Renderers[x.Slug].Version == x.TemplateVersion), "Versioned recommendations include real renderer identity and reasons");
Check(CvThemeMatcher.Level("junior") == "junior" && CvThemeMatcher.Level("fresher") == "fresher", "Junior and fresher remain distinct");
Check(CvThemeMatcher.Level("trưởng nhóm") == "lead" && CvThemeMatcher.Level("middle") == "mid", "Vietnamese/English target level aliases");
await Reject(() => Task.Run(() => CvThemeMatcher.Level("junior senior", true)), 400, "Conflicting target levels rejected");
await Reject(() => Task.Run(() => CvThemeMatcher.Rank(themes, new() { SoCot = 3 }, "Backend", [])), 400, "Invalid column count rejected");
Check(CvThemeMatcher.Industry("công nghệ thông tin") == "it" && CvThemeMatcher.Industry("hospitality") != "it", "Industry aliases use whole phrases, not accidental IT substrings");
var healthcare = CvThemeMatcher.Rank(themes, new() { ViTri = "Điều dưỡng", Nganh = "Y tế" }, "Điều dưỡng", []);
Check(healthcare.First().Slug == "care-plus", "Healthcare gets healthcare renderer rather than IT");
var finance = CvThemeMatcher.Rank(themes, new() { ViTri = "Finance", Nganh = "Tài chính", CapBac = "senior" }, "Finance", []);
Check(finance.First().Slug == "vault-finance", "Finance senior prefers finance template");
var design = CvThemeMatcher.Rank(themes, new() { ViTri = "Designer", Nganh = "Thiết kế", PhongCach = "sáng tạo", UuTienATS = false }, "Designer", []);
Check(design.First().Slug == "creative-portfolio", "Creative preference is distinct from ATS priority");
Check(CvThemeMatcher.Rank(themes.Where(t => !t.ThanThienATS), new() { BatBuocATS = true }, "Designer", []).Count == 0, "No-match hard requirement returns no fabricated fallback");
var unknown = CvThemeMatcher.Rank(themes, new(), "", []);
Check(unknown.All(r => r.CanhBao.Any(w => w.Contains("Chưa biết"))), "Insufficient context is explicitly disclosed");
Check(CvThemeMatcher.Rank(themes, new() { TopN = 1000 }, "", []).Count <= 3, "Result count stays bounded");
themes[1].SoCot = 2;
Check(CvThemeMatcher.Rank(themes, junior, junior.ViTri!, []).First().SoCot == 1, "Renderer layout overrides inaccurate DB column metadata");
themes[1].SoCot = 1;
using var db = new CheckContext(new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString(), o => o.EnableNullChecks(false)).Options);
db.CvThemes.RemoveRange(db.CvThemes); await db.SaveChangesAsync(); db.CvThemes.AddRange(themes);
db.HoSoUngViens.AddRange(new HoSoUngVien { Id = 1, NguoiDungId = 1, ViTriUngTuyen = "Backend junior" }, new HoSoUngVien { Id = 2, NguoiDungId = 2, ViTriUngTuyen = "Điều dưỡng" });
db.CVUngViens.AddRange(new CVUngVien { Id = 1, HoSoUngVienId = 1, IsDefault = false }, new CVUngVien { Id = 2, HoSoUngVienId = 2, IsDefault = true });
await db.SaveChangesAsync(); db.ChangeTracker.Clear();
var current = new Current { Id = 1 }; var handler = new GetSuggestedCvThemesQueryHandler(db, current);
Check((await handler.Handle(new(), default)).Data.First().Slug == "ats-classic", "Default CV selection is restricted to current user, never another default CV");
await Reject(() => handler.Handle(new() { CvUngVienId = 2, ViTri = "Backend" }, default), 403, "Explicit foreign CV is denied");
Check((await handler.Handle(new() { UseSavedCv = false, ViTri = "Điều dưỡng", Nganh = "Y tế" }, default)).Data.First().Slug == "care-plus", "Draft/prompt criteria override stored CV goals without modifying CV");
var noStored = await handler.Handle(new() { UseSavedCv = false }, default);
Check(noStored.Data.All(x => x.ViTri == ""), "Blank draft does not silently read saved CV/profile");
current.Id = 99;
Check((await handler.Handle(new() { ViTri = "Backend", CapBac = "junior" }, default)).Succeeded, "Prompt-only recommendations work without any CV");
Check(await db.CVUngViens.CountAsync() == 2 && await db.CVUngViens.AnyAsync(x => x.Id == 1 && !x.IsDefault), "Recommendation flow makes no CV writes");
var validator = new GetSuggestedCvThemesQueryValidator();
Check(!validator.Validate(new GetSuggestedCvThemesQuery { ViTri = new string('a', 201) }).IsValid, "Oversized criteria rejected");
Check(!validator.Validate(new GetSuggestedCvThemesQuery { NhanManh = ["unknown"] }).IsValid, "Only supported emphasis sections accepted");
var assembly = typeof(WebApp.Server.Services.CurrentNguoiDungService).Assembly;
var toolType = assembly.GetType("WebApp.Server.Agent.Adam.Tools.CvQueryTools")!;
var tool = Activator.CreateInstance(toolType, new object?[] { null, null, null, new Deny(), null })!;
var method = toolType.GetMethod("SuggestCvThemeAsync")!;
var signature = method.GetParameters().Select(p => p.ParameterType).Append(method.ReturnType).ToArray();
var function = AIFunctionFactory.Create(method.CreateDelegate(System.Linq.Expressions.Expression.GetDelegateType(signature), tool));
var schema = function.JsonSchema.ToString();
Check(schema.Contains("nganh") && schema.Contains("capBac") && schema.Contains("soCot") && schema.Contains("batBuocATS"), "LLM function schema exposes structured theme criteria");
var shortcut = assembly.GetType("WebApp.Server.Agent.RecommenAdam.ScopedRecommenAdamAgent")!.GetMethod("IsJobRecommendationRequest", BindingFlags.NonPublic | BindingFlags.Static);
Check(shortcut is null, "Job-recommendation regex shortcut is removed; intent is delegated to the LLM");
Check(CvThemeMatcher.Industry("QA Tester") == "it" && CvThemeMatcher.Industry("Kỹ sư phần mềm") == "it", "QA/tester and Vietnamese role aliases resolve to IT");
var skillFallback = CvThemeMatcher.Rank(themes, new() { TopN = 3 }, "", ["React", "TypeScript"]);
Check(skillFallback.Count > 0 && skillFallback.All(r => r.Nganh == "it") && skillFallback.Any(r => r.LyDo.Contains("kỹ năng")), "Industry falls back to skills when position is unknown");
Console.WriteLine($"Completed {checks} CV-theme matching checks.");

sealed class Deny : IPermissionService { public Task RequireAsync(string resource, string action, CancellationToken ct = default) => throw new ApiException("Denied", 403); }
sealed class Current : ICurrentNguoiDungService { public int Id { get; set; } public Task<CurrentNguoiDungContext> ResolveAsync() => Task.FromResult(new CurrentNguoiDungContext { Id = Id, VaiTro = VaiTroNguoiDung.UNG_VIEN }); }
sealed class Clock : IDateTimeService { public DateTime Now => DateTime.UtcNow; public DateTime NowUtc => DateTime.UtcNow; }
sealed class Auth : IAuthenticatedUserService { public string UserId => "theme-check"; }
sealed class CheckContext(DbContextOptions<ApplicationDbContext> options) : ApplicationDbContext(options, new Clock(), new Auth())
{ protected override void OnModelCreating(ModelBuilder b) { base.OnModelCreating(b); b.Entity<CvTheme>().Ignore(x => x.Embedding); } }
