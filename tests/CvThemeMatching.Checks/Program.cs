using Application.DTOs.CV;
using Application.Exceptions;
using Application.Features.CVUngVien.Queries.GetCVUngVienById;
using Application.Features.CvTheme.Queries.GetCvThemeWorkspace;
using Application.Features.CvTheme.Queries.PickCvThemes;
using Application.Features.CvTheme.Queries.SuggestCvThemes;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Identity.Seeds;
using Infrastructure.Persistence.Contexts;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using System.Reflection;
using System.Text.Json;

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

// ============ Luồng agent: catalog lint + workspace DB + guard kiểm định ============
Check(CvThemeStudioSeedConfigs.Slugs.All(s => !CvThemeMatcher.Renderers.ContainsKey(s)), "Studio configs chỉ cấp cho mẫu thật sự chưa có renderer tĩnh");
Check(!CvThemeStudioSeedConfigs.Slugs.Contains("elegant-serif"), "Mẫu retired không bị hồi sinh bằng config Studio");
Check(CvThemeStudioSeedConfigs.Slugs.All(s => CvThemeMatcher.ResolveRenderer(
    new CvTheme { Slug = s, SoCot = 1, CauHinhJson = CvThemeStudioSeedConfigs.BuildJson(s, s, "mô tả", true) }) is not null),
    "Catalog lint: mọi mẫu trong bảng cấu hình Studio đều render được");
using (var config = JsonDocument.Parse(CvThemeStudioSeedConfigs.BuildJson("midnight-pro", "Midnight Pro", "Nền tối chữ trắng", false)!))
Check(config.RootElement.GetProperty("id").GetString() == "midnight-pro" && config.RootElement.GetProperty("name").GetString() == "Midnight Pro"
    && config.RootElement.GetProperty("policy").GetProperty("isPublished").GetBoolean(),
    "CauHinhJson sinh ra qua được cổng parseDbTheme (id + name + policy.isPublished)");

var studioRow = Theme(110, "sunset-gradient", "", "");
studioRow.CauHinhJson = CvThemeStudioSeedConfigs.BuildJson("sunset-gradient", "Sunset Gradient", "Header gradient rực rỡ cho ngành sáng tạo", false);
studioRow.SoCot = 2; studioRow.ThanThienATS = false;
db.CvThemes.Add(studioRow); await db.SaveChangesAsync(); db.ChangeTracker.Clear();

var workspaceHandler = new GetCvThemeWorkspaceQueryHandler(db, current, new StubSender());
current.Id = 1;
var workspace = (await workspaceHandler.Handle(new() { ViTri = "Backend Developer", CapBac = "junior", KyNang = ["Figma"] }, default)).Data!;
var catalogSlugs = workspace.Catalog.Select(c => c.Slug).ToArray();
Check(catalogSlugs.Length == 7 && catalogSlugs.Contains("sunset-gradient") && !catalogSlugs.Contains("not-a-renderer") && !catalogSlugs.Contains("devops-stack"),
    "Agent catalog = 8 mẫu active trừ 2 mẫu không renderer: mồ côi CauHinhJson vào cuộc, mẫu tắt vẫn bị loại");
Check(workspace.Catalog.First(c => c.Slug == "sunset-gradient").TuCauHinhTheme && workspace.Catalog.First(c => c.Slug == "sunset-gradient").SoCot == 2
    && !workspace.Catalog.First(c => c.Slug == "ats-classic").TuCauHinhTheme,
    "Catalog phân biệt mẫu ThemeCanvas (2 cột từ DB) với renderer tĩnh");
Check(workspace.NganhSuyDuoc == "it" && workspace.CapBacSuyDuoc == "junior" && workspace.ThieuTieuChi.Count == 0 && workspace.MatchingVersion == "theme-v2",
    "Workspace suy ngành/cấp độ bằng đúng rule matcher và tự khai tiêu chí còn thiếu");
Check(workspace.Cv.CvId == 1 && workspace.Cv.ViTriMucTieu == "Backend Developer" && workspace.Cv.CoAvatar
    && workspace.Cv.KyNang.Count == 3 && workspace.Cv.SoNamKyNangCaoNhat == 4f && workspace.Cv.CoDuAn && workspace.Cv.CoChungChi
    && workspace.Cv.DuAn[0].CongNghe.SequenceEqual(["React", "Postgres"]) && workspace.Cv.TomTat!.EndsWith("…") && workspace.Cv.TomTat.Length == 401,
    "Digest CV đọc từ DB: kỹ năng kèm mức thành thạo/số năm, dự án kèm công nghệ, chứng chỉ, avatar, tóm tắt cắt ngắn");

var pick = new PickCvThemesQueryHandler(db, current);
var chosen = await pick.Handle(new() { Slugs = ["ats-classic", "sunset-gradient", "mau-khong-ton-tai"], LyDo = ["Hợp backend junior ATS", "Adam thích gradient"] }, default);
Check(chosen.Succeeded && chosen.Data!.Count == 2 && chosen.Data.All(x => x.MatchingVersion == "theme-agent-v1"),
    "Guard giữ 2 mẫu hợp lệ (kể cả mẫu Studio), chặn slug model bịa");
Check(chosen.Data[0].Slug == "ats-classic" && chosen.Data[0].LyDo == "Hợp backend junior ATS" && chosen.Data[0].Diem > 0.5,
    "Lý do của model trình bày cho user; điểm rule vẫn là tham chiếu khách quan");
Check(chosen.Data[1].Diem == 0.5 && chosen.Data[1].CanhBao.Any(w => w.Contains("Metadata mẫu chưa đủ")),
    "Mẫu rule không xếp hạng vẫn được chấp nhận với điểm sàn và cảnh báo minh bạch");
Check(chosen.Data[0].CanhBao.Any(w => w.Contains("mau-khong-ton-tai")), "Mẫu bị loại được khai báo thay vì âm thầm biến mất");
Check((await pick.Handle(new() { Slugs = ["khong-co-that", "devops-stack", "not-a-renderer"] }, default)).Data!.Count == 0,
    "Slug bịa + mẫu tắt + mẫu không renderer: trả về rỗng, không bịa fallback");
var strictAts = await pick.Handle(new() { Slugs = ["creative-portfolio", "ats-classic"], BatBuocATS = true }, default);
Check(strictAts.Data!.Single().Slug == "ats-classic" && strictAts.Data[0].CanhBao.Any(w => w.Contains("ATS")),
    "Ràng buộc ATS bắt buộc của user không bị quyết định của model lấn át");
var wrongColumns = await pick.Handle(new() { Slugs = ["sunset-gradient"], SoCot = 1 }, default);
Check(wrongColumns.Data!.Count == 0 && wrongColumns.Message!.Contains("Không mẫu nào"), "Ràng buộc số cột kiểm định theo renderer thật, không theo metadata");
await Reject(() => pick.Handle(new() { Slugs = [] }, default), 400, "Pick rỗng slug bị chặn");
var pickValidator = new PickCvThemesQueryValidator();
Check(!pickValidator.Validate(new PickCvThemesQuery { Slugs = ["a", "b", "c", "d"] }).IsValid && !pickValidator.Validate(new PickCvThemesQuery { Slugs = [] }).IsValid,
    "Validator chặn pick nhiều hơn 3 hoặc 0 mẫu");
// "Admin vừa tạo mẫu mới" — 3 hình thái row INSERT thẳng vào cv_themes, không qua seed.
// Payload đầu tiên mô phỏng đúng themeToDbInput của Studio: JSON.stringify(theme) nên luôn có id/name.
var adminNew = Theme(120, "mau-admin-moi", "", "");
adminNew.CauHinhJson = """{"id":"mau-admin-moi","name":"Mẫu Admin Mới","structure":"sidebar-left","colors":{"primary":"#7c3aed"},"policy":{"isPublished":true}}""";
adminNew.SoCot = 2;
var metadataOnly = Theme(121, "chua-luu-studio", "IT", "Backend", "junior");
var junkConfig = Theme(122, "json-thieu-id", "IT", "Backend", "junior");
junkConfig.CauHinhJson = """{"structure":"single"}""";
db.CvThemes.AddRange(adminNew, metadataOnly, junkConfig);
await db.SaveChangesAsync(); db.ChangeTracker.Clear();
var freshSlugs = (await workspaceHandler.Handle(new() { ViTri = "Backend Developer" }, default)).Data!.Catalog;
Check(freshSlugs.First(c => c.Slug == "mau-admin-moi").TuCauHinhTheme && freshSlugs.First(c => c.Slug == "mau-admin-moi").SoCot == 2,
    "Mẫu admin VỪA tạo trong Studio vào catalog agent ngay, không cần seed hay restart");
Check(!freshSlugs.Any(c => c.Slug == "chua-luu-studio"),
    "Mẫu admin chỉ nhập metadata (CauHinhJson null) bị loại — đúng bug 16 mẫu ma, guard không nới");
Check((await pick.Handle(new() { Slugs = ["mau-admin-moi", "chua-luu-studio"] }, default)).Data!.Single().Slug == "mau-admin-moi",
    "Guard nhận mẫu mới của admin, chặn mẫu metadata-only");
// LỖ HỔNG ĐÃ BIẾT: backend chỉ kiểm chuỗi config không rỗng, còn parseDbTheme cần id + name.
// Khi ResolveRenderer siết chuẩn, assert này phải đảo thành "không renderer" — đừng xoá im lặng.
Check(freshSlugs.Any(c => c.Slug == "json-thieu-id"),
    "GHI NHẬN lỗ hổng: CauHinhJson thiếu id/name vẫn vào catalog nhưng frontend không render được");
Check(await db.CVUngViens.CountAsync() == 2 && !await db.CVUngViens.AnyAsync(x => x.TemplateId != null),
    "Workspace và pick chỉ đọc: không ghi CV, không tự đổi mẫu");

var themeSchemaTool = assembly.GetType("WebApp.Server.Agent.Adam.Tools.CvQueryTools")!;
foreach (var (name, required) in new (string, string[])[] {
    ("GetCvThemeWorkspaceAsync", ["cvId", "viTri", "nganh", "capBac"]),
    ("PickCvThemesAsync", ["slugs", "lyDo", "soCot", "batBuocATS"]) })
{
    var m = themeSchemaTool.GetMethod(name)!;
    var sig = m.GetParameters().Select(p => p.ParameterType).Append(m.ReturnType).ToArray();
    var fn = AIFunctionFactory.Create(m.CreateDelegate(System.Linq.Expressions.Expression.GetDelegateType(sig), Activator.CreateInstance(themeSchemaTool, new object?[] { null, null, null, new Deny(), null })!));
    var json = fn.JsonSchema.ToString();
    Check(required.All(r => json.Contains(r)), $"LLM function schema of {name} exposes {string.Join("/", required)}");
}
var prompt = (string)assembly.GetType("WebApp.Server.Agent.RecommenAdam.Candidate.CandidateAdamInstructions")!
    .GetField("SystemPrompt", BindingFlags.Static | BindingFlags.Public)!.GetValue(null)!;
Check(prompt.Contains("get_cv_theme_workspace") && prompt.Contains("pick_cv_themes") && prompt.Contains("CHÉP NGUYÊN VĂN"),
    "System prompt dạy agent đọc workspace trước rồi mới trình quyết định, chép slug nguyên văn");
Console.WriteLine($"Completed {checks} CV-theme matching checks.");

sealed class Deny : IPermissionService { public Task RequireAsync(string resource, string action, CancellationToken ct = default) => throw new ApiException("Denied", 403); }
sealed class StubSender : ISender
{
    public Task<TResponse> Send<TResponse>(IRequest<TResponse> request, CancellationToken cancellationToken = default)
        => Task.FromResult(request is GetCVUngVienByIdQuery ? (TResponse)(object)new Response<CvDetailDto>(Detail) : default!);
    public Task<object?> Send(object request, CancellationToken cancellationToken = default)
        => Task.FromResult<object?>(request is GetCVUngVienByIdQuery ? new Response<CvDetailDto>(Detail) : null);
    public Task Send<TRequest>(TRequest request, CancellationToken cancellationToken = default) where TRequest : IRequest
        => Task.CompletedTask;
    public IAsyncEnumerable<TResponse> CreateStream<TResponse>(IStreamRequest<TResponse> request, CancellationToken cancellationToken = default)
        => throw new NotSupportedException();
    public IAsyncEnumerable<object?> CreateStream(object request, CancellationToken cancellationToken = default)
        => throw new NotSupportedException();
    private static CvDetailDto Detail => new()
    {
        Id = 1,
        NoiDung = new ParsedCvDto
        {
            ThongTinLienHe = new ParsedThongTinLienHeDto
            {
                ViTriUngTuyen = "Backend Developer", GioiThieuBanThan = new string('b', 500), AnhDaiDienUrl = "https://cdn/a.png",
            },
            KyNang =
            [
                new ParsedKyNangDto { TenKyNang = "React", MucDoThanhThao = MucDo.ThanhThao, SoNamKinhNghiem = 4f },
                new ParsedKyNangDto { TenKyNang = "PostgreSQL", MucDoThanhThao = MucDo.TrungBinh, SoNamKinhNghiem = 2f },
                new ParsedKyNangDto { TenKyNang = "  " },
            ],
            KinhNghiemLamViec = [new ParsedKinhNghiemDto { ChucDanh = "Backend Developer", TenCongTy = "FPT", TuNgay = "01/2023", KyNangSuDung = [new ParsedKyNangThamChieuDto { TenKyNang = "Java" }] }],
            HocVan = [new ParsedHocVanDto { BangCap = "Cử nhân", ChuyenNganh = "CNTT", Truong = "UIT" }],
            DuAn = [new ParsedDuAnDto { TenDuAn = "ATS engine", VaiTro = "Lead", CongNghe = [new ParsedKyNangThamChieuDto { TenKyNang = "React" }, new ParsedKyNangThamChieuDto { TenKyNang = "Postgres" }] }],
            ChungChi = [new ParsedChungChiDto { TenChungChi = "AWS SA" }, new ParsedChungChiDto { TenChungChi = "" }],
        }
    };
}
sealed class Current : ICurrentNguoiDungService { public int Id { get; set; } public Task<CurrentNguoiDungContext> ResolveAsync() => Task.FromResult(new CurrentNguoiDungContext { Id = Id, VaiTro = VaiTroNguoiDung.UNG_VIEN }); }
sealed class Clock : IDateTimeService { public DateTime Now => DateTime.UtcNow; public DateTime NowUtc => DateTime.UtcNow; }
sealed class Auth : IAuthenticatedUserService { public string UserId => "theme-check"; }
sealed class CheckContext(DbContextOptions<ApplicationDbContext> options) : ApplicationDbContext(options, new Clock(), new Auth())
{ protected override void OnModelCreating(ModelBuilder b) { base.OnModelCreating(b); b.Entity<CvTheme>().Ignore(x => x.Embedding); } }
