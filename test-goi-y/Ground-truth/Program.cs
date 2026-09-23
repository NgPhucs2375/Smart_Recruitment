using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Identity.Contexts;
using Infrastructure.Identity.Models;
using Infrastructure.Persistence.Contexts;
using Infrastructure.Shared.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

const string Marker = "[GT]";
var connectionString = GetArgument(args, "--connection") ?? Environment.GetEnvironmentVariable("GT_CONNECTION");
var outputPath = GetArgument(args, "--output") ?? Path.Combine(Directory.GetCurrentDirectory(), "ground-truth.csv");

if (string.IsNullOrWhiteSpace(connectionString))
{
    Console.Error.WriteLine("Thiếu chuỗi kết nối. Dùng --connection hoặc biến môi trường GT_CONNECTION.");
    return 1;
}

var applicationOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
    .UseNpgsql(connectionString)
    .Options;
var identityOptions = new DbContextOptionsBuilder<IdentityContext>()
    .UseNpgsql(connectionString)
    .Options;

await using var application = new ApplicationDbContext(applicationOptions, new DateTimeService(), new SeedUserService());
await using var identity = new IdentityContext(identityOptions);

var role = await identity.Roles.SingleOrDefaultAsync(x => x.NormalizedName == "UNG_VIEN");
if (role == null)
    throw new InvalidOperationException("Chưa có role UNG_VIEN. Hãy khởi động WebApp.Server một lần để chạy seed mặc định.");

var recruiters = await application.HoSoNhaTuyenDungs
    .AsNoTracking()
    .OrderBy(x => x.Id)
    .Select(x => new Recruiter(x.NguoiDungId, x.DoanhNghiepId))
    .ToListAsync();
if (recruiters.Count == 0)
    throw new InvalidOperationException("Chưa có nhân sự/nhà tuyển dụng. Hãy chạy seed mặc định trước.");

var categories = await EnsureCategoriesAsync(application);
var skillIds = await EnsureSkillsAsync(application, BenchmarkData.Profiles.SelectMany(x => x.Skills).Distinct(StringComparer.OrdinalIgnoreCase));

await RemovePreviousJobsAsync(application);
var candidates = new List<CandidateSeed>();
foreach (var profile in BenchmarkData.Profiles)
    candidates.Add(await UpsertCandidateAsync(application, identity, role.Id, profile, skillIds));

var labels = await SeedJobsAndLabelsAsync(application, candidates, recruiters, categories, skillIds);
Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(outputPath))!);
await File.WriteAllLinesAsync(outputPath, labels.Select(ToCsv));

Console.WriteLine($"Đã tạo {candidates.Count} CV mặc định và {candidates.Count * 5} tin tuyển dụng {Marker}.");
Console.WriteLine($"Đã xuất {labels.Count - 1} nhãn phù hợp vào: {Path.GetFullPath(outputPath)}");
Console.WriteLine("Tài khoản test: gt.ungvien01@seed.local đến gt.ungvien15@seed.local, mật khẩu: 123Pa$$word!");
return 0;

static async Task<Dictionary<string, int>> EnsureCategoriesAsync(ApplicationDbContext db)
{
    var names = BenchmarkData.Profiles.Select(x => x.Category).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
    var existing = await db.DanhMucNghes.AsTracking().ToListAsync();
    foreach (var name in names.Where(name => existing.All(x => !string.Equals(x.TenNghe, name, StringComparison.OrdinalIgnoreCase))))
        db.DanhMucNghes.Add(new DanhMucNghe { TenNghe = name, MoTa = $"Danh mục seed {Marker}", IsActive = true });
    await db.SaveChangesAsync();

    return (await db.DanhMucNghes.AsNoTracking().ToListAsync())
        .Where(x => names.Contains(x.TenNghe, StringComparer.OrdinalIgnoreCase))
        .ToDictionary(x => x.TenNghe, x => x.Id, StringComparer.OrdinalIgnoreCase);
}

static async Task<Dictionary<string, int>> EnsureSkillsAsync(ApplicationDbContext db, IEnumerable<string> names)
{
    var requested = names.Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
    var existing = await db.KyNangs.AsTracking().ToListAsync();
    foreach (var name in requested.Where(name => existing.All(x => !string.Equals(x.TenKyNang, name, StringComparison.OrdinalIgnoreCase))))
        db.KyNangs.Add(new KyNang { TenKyNang = name, MoTa = $"Kỹ năng dùng cho benchmark {Marker}" });
    await db.SaveChangesAsync();

    return (await db.KyNangs.AsNoTracking().ToListAsync())
        .Where(x => requested.Contains(x.TenKyNang, StringComparer.OrdinalIgnoreCase))
        .ToDictionary(x => x.TenKyNang, x => x.Id, StringComparer.OrdinalIgnoreCase);
}

static async Task RemovePreviousJobsAsync(ApplicationDbContext db)
{
    var jobIds = await db.TinTuyenDungs
        .Where(x => x.TieuDe.StartsWith(Marker))
        .Select(x => x.Id)
        .ToListAsync();
    if (jobIds.Count == 0) return;

    await db.KetQuaPhuHops.Where(x => jobIds.Contains(x.TinTuyenDungId)).ExecuteDeleteAsync();
    await db.KyNangTinTuyenDungs.Where(x => jobIds.Contains(x.TinTuyenDungId)).ExecuteDeleteAsync();
    await db.TinTuyenDungs.Where(x => jobIds.Contains(x.Id)).ExecuteDeleteAsync();
}

static async Task<CandidateSeed> UpsertCandidateAsync(
    ApplicationDbContext db,
    IdentityContext identity,
    string roleId,
    Profile profile,
    IReadOnlyDictionary<string, int> skillIds)
{
    var user = await identity.Users.AsTracking().SingleOrDefaultAsync(x => x.Email == profile.Email);
    if (user == null)
    {
        user = new ApplicationUser
        {
            UserName = profile.Email,
            NormalizedUserName = profile.Email.ToUpperInvariant(),
            Email = profile.Email,
            NormalizedEmail = profile.Email.ToUpperInvariant(),
            EmailConfirmed = true,
            FirstName = profile.Name.Split(' ').Last(),
            LastName = string.Join(' ', profile.Name.Split(' ').Take(profile.Name.Split(' ').Length - 1)),
            SecurityStamp = Guid.NewGuid().ToString(),
            ConcurrencyStamp = Guid.NewGuid().ToString(),
        };
        user.PasswordHash = new PasswordHasher<ApplicationUser>().HashPassword(user, "123Pa$$word!");
        identity.Users.Add(user);
        await identity.SaveChangesAsync();
    }

    if (!await identity.UserRoles.AnyAsync(x => x.UserId == user.Id && x.RoleId == roleId))
    {
        identity.UserRoles.Add(new IdentityUserRole<string> { UserId = user.Id, RoleId = roleId });
        await identity.SaveChangesAsync();
    }

    var account = await db.NguoiDungs.AsTracking().SingleOrDefaultAsync(x => x.ApplicationUserId == user.Id);
    if (account == null)
    {
        account = new NguoiDung { ApplicationUserId = user.Id, VaiTro = VaiTroNguoiDung.UNG_VIEN, IsActive = true };
        db.NguoiDungs.Add(account);
        await db.SaveChangesAsync();
    }

    var candidate = await db.HoSoUngViens.AsTracking().SingleOrDefaultAsync(x => x.NguoiDungId == account.Id);
    if (candidate == null)
    {
        candidate = new HoSoUngVien { NguoiDungId = account.Id };
        db.HoSoUngViens.Add(candidate);
    }
    candidate.HoTen = profile.Name;
    candidate.SDT = profile.Phone;
    candidate.NgaySinh = new DateTime(profile.BirthYear, 6, 15, 0, 0, 0, DateTimeKind.Utc);
    candidate.GioiTinh = profile.Gender;
    candidate.DiaChi = profile.Location;
    candidate.GioiThieu = $"Ứng viên benchmark {Marker}: {profile.Role}, {profile.Years} năm kinh nghiệm.";
    candidate.ViTriUngTuyen = profile.Role;
    candidate.MucLuongMongMuon = (double)profile.Salary;
    candidate.IsTimViec = true;
    await db.SaveChangesAsync();

    await db.KyNangUngViens.Where(x => x.HoSoUngVienId == candidate.Id).ExecuteDeleteAsync();
    db.KyNangUngViens.AddRange(profile.Skills.Select((skill, index) => new KyNangUngVien
    {
        HoSoUngVienId = candidate.Id,
        KyNangId = skillIds[skill],
        SoNamKinhNghiem = Math.Max(1, profile.Years - index / 2f),
        MucDoThongThao = profile.Years >= 4 ? MucDo.ThanhThao : MucDo.TrungBinh,
    }));

    await db.CVUngViens.Where(x => x.HoSoUngVienId == candidate.Id).ExecuteUpdateAsync(x => x.SetProperty(cv => cv.IsDefault, false));
    var cv = await db.CVUngViens.AsTracking().SingleOrDefaultAsync(x => x.HoSoUngVienId == candidate.Id && x.TenFile == $"ground-truth-{profile.Number:00}.json");
    if (cv == null)
    {
        cv = new CVUngVien
        {
            HoSoUngVienId = candidate.Id,
            TenFile = $"ground-truth-{profile.Number:00}.json",
            FileUrl = $"seed://ground-truth/cv-{profile.Number:00}",
            StorageKey = $"ground-truth/cv-{profile.Number:00}.json",
            FileMimeType = "application/json",
            FileSize = 0,
            TemplateId = "benchmark",
            PhuongThucTao = PhuongThucTaoCV.AIAgentHoTro,
            IsDefault = true,
            IsDaXoa = false,
        };
        db.CVUngViens.Add(cv);
        await db.SaveChangesAsync();
    }
    else
    {
        cv.IsDefault = true;
        cv.IsDaXoa = false;
        await db.SaveChangesAsync();
    }

    await db.Set<CVThongTinLienHe>().Where(x => x.CVUngVienId == cv.Id).ExecuteDeleteAsync();
    await db.Set<CVKyNang>().Where(x => x.CVUngVienId == cv.Id).ExecuteDeleteAsync();
    await db.Set<CVKinhNghiemLamViec>().Where(x => x.CVUngVienId == cv.Id).ExecuteDeleteAsync();
    await db.Set<CVHocVan>().Where(x => x.CVUngVienId == cv.Id).ExecuteDeleteAsync();
    db.Add(new CVThongTinLienHe
    {
        CVUngVienId = cv.Id, HoTen = profile.Name, Email = profile.Email, SDT = profile.Phone,
        DiaChi = profile.Location, ViTriUngTuyen = profile.Role, MucLuongMongMuon = profile.Salary,
        GioiTinh = profile.Gender, GioiThieuBanThan = $"{profile.Years} năm kinh nghiệm {profile.Role}.",
    });
    db.AddRange(profile.Skills.Select((skill, index) => new CVKyNang
    {
        CVUngVienId = cv.Id, KyNangId = skillIds[skill], TenKyNang = skill,
        MucDoThanhThao = profile.Years >= 4 ? MucDo.ThanhThao : MucDo.TrungBinh,
        SoNamKinhNghiem = Math.Max(1, profile.Years - index / 2f), ThuTu = index + 1,
    }));
    db.Add(new CVKinhNghiemLamViec
    {
        CVUngVienId = cv.Id, CongTy = "Công ty demo benchmark", ChucDanh = profile.Role,
        TuThang = 1, TuNam = DateTime.UtcNow.Year - profile.Years, IsHienTai = true,
        MoTa = $"Kinh nghiệm với {string.Join(", ", profile.Skills)}.", ThuTu = 1,
    });
    db.Add(new CVHocVan
    {
        CVUngVienId = cv.Id, Truong = "Đại học benchmark", ChuyenNganh = profile.Category,
        TuThang = 9, TuNam = (short)(profile.BirthYear + 18), DenThang = 6, DenNam = (short)(profile.BirthYear + 22),
        IsHienTai = false, MoTa = "Dữ liệu kiểm thử.", ThuTu = 1,
    });
    await db.SaveChangesAsync();
    return new CandidateSeed(profile, candidate.Id, cv.Id);
}

static async Task<List<GroundTruthRow>> SeedJobsAndLabelsAsync(
    ApplicationDbContext db,
    IReadOnlyList<CandidateSeed> candidates,
    IReadOnlyList<Recruiter> recruiters,
    IReadOnlyDictionary<string, int> categories,
    IReadOnlyDictionary<string, int> skillIds)
{
    var labels = new List<GroundTruthRow> { new("candidate_email", "cv_id", "job_id", "job_title", "label", "reason") };
    foreach (var candidate in candidates)
    {
        for (var variant = 1; variant <= 5; variant++)
        {
            var relevant = variant <= 3;
            var source = relevant
                ? candidate.Profile
                : BenchmarkData.Profiles[(candidate.Profile.Number + variant) % BenchmarkData.Profiles.Count];
            var recruiter = recruiters[(candidate.Profile.Number + variant - 1) % recruiters.Count];
            var title = $"{Marker} {source.Role} - bộ {candidate.Profile.Number:00}.{variant}";
            var job = new TinTuyenDung
            {
                DoanhNghiepId = recruiter.CompanyId,
                NguoiDangTinId = recruiter.AccountId,
                DanhMucNgheId = categories[source.Category],
                TieuDe = title,
                MoTaCongViec = $"Tin benchmark. Cần {string.Join(", ", source.Skills)}.",
                KinhNghiemYeuCau = $"{Math.Max(1, source.Years - 1)} năm",
                YeuCauCongViec = string.Join(", ", source.Skills),
                QuyenLoi = "Lương cạnh tranh, bảo hiểm, đào tạo.",
                DiaDiemLamViec = relevant ? candidate.Profile.Location : source.Location,
                PhuongThucLamViec = variant == 2 ? PhuongThucLamViec.Hybrid : PhuongThucLamViec.Onsite,
                LuongToiThieu = relevant ? candidate.Profile.Salary - 2_000_000 : source.Salary - 1_000_000,
                LuongToiDa = relevant ? candidate.Profile.Salary + 5_000_000 : source.Salary + 3_000_000,
                TrangThai = TrangThaiTinTuyenDung.DangTuyen,
                NgayHetHan = DateTime.UtcNow.AddDays(60),
            };
            db.TinTuyenDungs.Add(job);
            await db.SaveChangesAsync();
            db.KyNangTinTuyenDungs.AddRange(source.Skills.Select((skill, index) => new KyNangTinTuyenDung
            {
                TinTuyenDungId = job.Id, KyNangId = skillIds[skill],
                MucDoYeuCau = index < 2 ? MucDoYC.BatBuc : MucDoYC.UuTien,
            }));
            await db.SaveChangesAsync();

            if (relevant)
                labels.Add(new GroundTruthRow(candidate.Profile.Email, candidate.CvId.ToString(), job.Id.ToString(), title, "1", "Khớp vị trí, kỹ năng cốt lõi, lương và địa điểm đã được thiết kế trước."));
        }
    }
    return labels;
}

static string ToCsv(GroundTruthRow row) => string.Join(',', new[] { row.CandidateEmail, row.CvId, row.JobId, row.JobTitle, row.Label, row.Reason }.Select(EscapeCsv));
static string EscapeCsv(string value) => $"\"{value.Replace("\"", "\"\"")}\"";
static string? GetArgument(string[] values, string name)
{
    var index = Array.IndexOf(values, name);
    return index >= 0 && index < values.Length - 1 ? values[index + 1] : null;
}

sealed class SeedUserService : IAuthenticatedUserService { public string UserId => "ground-truth-seed"; }
record Recruiter(int AccountId, int CompanyId);
record CandidateSeed(Profile Profile, int CandidateId, int CvId);
record GroundTruthRow(string CandidateEmail, string CvId, string JobId, string JobTitle, string Label, string Reason);
record Profile(int Number, string Name, string Email, string Phone, string Gender, int BirthYear, string Role, string Category, string Location, decimal Salary, int Years, string[] Skills);

static class BenchmarkData
{
    public static IReadOnlyList<Profile> Profiles { get; } =
    [
    new Profile(1, "Nguyễn Thị Mai", "gt.ungvien01@seed.local", "0901000001", "Nữ", 1999, "Frontend Developer", "Công nghệ thông tin", "Cầu Giấy, Hà Nội", 18_000_000, 3, ["JavaScript", "TypeScript", "React", "HTML", "CSS"]),
    new Profile(2, "Trần Văn Hùng", "gt.ungvien02@seed.local", "0901000002", "Nam", 1996, "Backend Developer .NET", "Công nghệ thông tin", "Bình Thạnh, TP. Hồ Chí Minh", 25_000_000, 5, ["C#", ".NET", "ASP.NET Core", "SQL", "Docker"]),
    new Profile(3, "Lê Thị Hương", "gt.ungvien03@seed.local", "0901000003", "Nữ", 1997, "Data Analyst", "Công nghệ thông tin", "Hải Châu, Đà Nẵng", 22_000_000, 4, ["SQL", "Python", "Power BI", "Excel", "Statistics"]),
    new Profile(4, "Phạm Văn Tuấn", "gt.ungvien04@seed.local", "0901000004", "Nam", 1998, "QA Tester", "Công nghệ thông tin", "Đống Đa, Hà Nội", 16_000_000, 3, ["Manual Testing", "API Testing", "SQL", "Postman", "Selenium"]),
    new Profile(5, "Hoàng Thị Lan", "gt.ungvien05@seed.local", "0901000005", "Nữ", 1995, "UI UX Designer", "Thiết kế / Đồ họa", "Quận 3, TP. Hồ Chí Minh", 20_000_000, 5, ["Figma", "UI Design", "UX Research", "Prototyping", "Design System"]),
    new Profile(6, "Vũ Minh Hoàng", "gt.ungvien06@seed.local", "0901000006", "Nam", 1994, "DevOps Engineer", "Công nghệ thông tin", "Thủ Đức, TP. Hồ Chí Minh", 30_000_000, 6, ["Docker", "Kubernetes", "CI CD", "Linux", "AWS"]),
    new Profile(7, "Đỗ Thị Nga", "gt.ungvien07@seed.local", "0901000007", "Nữ", 1996, "Digital Marketing Specialist", "Marketing", "Thanh Xuân, Hà Nội", 17_000_000, 4, ["SEO", "Google Ads", "Facebook Ads", "Content Marketing", "Analytics"]),
    new Profile(8, "Bùi Văn Nam", "gt.ungvien08@seed.local", "0901000008", "Nam", 1993, "Kế toán tổng hợp", "Tài chính / Kế toán", "Cần Thơ", 16_000_000, 7, ["Accounting", "Excel", "Tax", "MISA", "Financial Reporting"]),
    new Profile(9, "Nguyễn Văn Thắng", "gt.ungvien09@seed.local", "0901000009", "Nam", 1997, "Chuyên viên tuyển dụng", "Nhân sự", "Hai Bà Trưng, Hà Nội", 15_000_000, 4, ["Recruitment", "Interviewing", "ATS", "Employer Branding", "Excel"]),
    new Profile(10, "Trịnh Thị Hoa", "gt.ungvien10@seed.local", "0901000010", "Nữ", 1998, "Nhân viên kinh doanh", "Bán hàng / Kinh doanh", "Biên Hòa, Đồng Nai", 14_000_000, 3, ["Sales", "CRM", "Negotiation", "Customer Service", "Excel"]),
    new Profile(11, "Lý Quốc Bảo", "gt.ungvien11@seed.local", "0901000011", "Nam", 1995, "Business Analyst", "Công nghệ thông tin", "Quận 1, TP. Hồ Chí Minh", 24_000_000, 5, ["Business Analysis", "SQL", "UML", "Figma", "Agile"]),
    new Profile(12, "Ngô Thu Hà", "gt.ungvien12@seed.local", "0901000012", "Nữ", 2000, "Mobile Developer", "Công nghệ thông tin", "Ba Đình, Hà Nội", 20_000_000, 3, ["Flutter", "Dart", "Firebase", "REST API", "Git"]),
    new Profile(13, "Đặng Minh Đức", "gt.ungvien13@seed.local", "0901000013", "Nam", 1992, "Logistics Coordinator", "Logistics / Chuỗi cung ứng", "Hải Phòng", 18_000_000, 8, ["Logistics", "Inventory", "Excel", "SAP", "Supply Chain"]),
    new Profile(14, "Phan Mỹ Duyên", "gt.ungvien14@seed.local", "0901000014", "Nữ", 1999, "Customer Support Specialist", "Dịch vụ khách hàng", "Nha Trang, Khánh Hòa", 13_000_000, 3, ["Customer Service", "CRM", "Communication", "Zendesk", "English"]),
    new Profile(15, "Tạ Anh Khoa", "gt.ungvien15@seed.local", "0901000015", "Nam", 1996, "Machine Learning Engineer", "Công nghệ thông tin", "Tây Hồ, Hà Nội", 32_000_000, 5, ["Python", "Machine Learning", "TensorFlow", "SQL", "Docker"]),
    ];
}
