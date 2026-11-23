#nullable enable
using System.Text.Json;
using Application.Features.KetQuaPhuHop.Cache;
using Application.Features.KetQuaPhuHop.Matching;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Identity.Models;
using Infrastructure.Persistence.Contexts;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using WebApp.Server.DemoSeed.Content;

namespace WebApp.Server.DemoSeed;

/// <summary>
/// Bộ nạp dữ liệu demo chạy một lần bằng tham số dòng lệnh (--seed-demo).
/// Idempotent theo khoá tự nhiên: tin theo (doanh nghiệp, tiêu đề), ứng viên theo
/// email @demo.local, đơn theo unique (tin, hồ sơ). Created bị audit ghi đè khi
/// SaveChanges nên mọi mốc thời gian được lùi bằng SQL thô sau khi lưu.
/// </summary>
internal static class DemoSeedRunner
{
    private const string Password = "123Pa$$word!";
    private const string DemoEmailSuffix = "@demo.local";

    private static readonly string[] Schools =
    [
        "Đại học Bách khoa Hà Nội",
        "Đại học Công nghệ – ĐHQG Hà Nội",
        "Đại học Kinh tế Quốc dân",
        "Đại học Ngoại thương",
        "Đại học Bách khoa – ĐHQG TP. Hồ Chí Minh",
        "Đại học Kinh tế TP. Hồ Chí Minh",
        "Đại học Đà Nẵng",
        "Đại học Cần Thơ",
        "Đại học Đà Lạt",
        "Đại học Nha Trang",
        "Đại học Sư phạm Hà Nội",
        "Đại học FPT"
    ];

    private static readonly Dictionary<string, string[]> AdjacentFamilies = new(StringComparer.Ordinal)
    {
        ["dotnet"] = ["frontend", "fullstack", "devops", "qa"],
        ["frontend"] = ["fullstack", "design", "dotnet"],
        ["fullstack"] = ["dotnet", "frontend", "data"],
        ["data"] = ["fullstack", "finance"],
        ["devops"] = ["dotnet", "qa"],
        ["qa"] = ["dotnet", "devops", "mechanical"],
        ["design"] = ["frontend", "marketing"],
        ["hr"] = ["customer-service", "marketing"],
        ["sales"] = ["customer-service", "marketing"],
        ["accounting"] = ["finance", "logistics"],
        ["marketing"] = ["design", "sales", "hr"],
        ["logistics"] = ["accounting", "sales", "food"],
        ["mechanical"] = ["qa", "food", "logistics"],
        ["food"] = ["mechanical", "logistics", "qa"],
        ["education"] = ["customer-service", "hr"],
        ["hospitality"] = ["customer-service", "sales"],
        ["customer-service"] = ["sales", "hr", "hospitality"],
        ["finance"] = ["accounting", "data"]
    };

    public static async Task RunAsync(IServiceProvider services, DemoSeedOptions options, ILogger logger)
    {
        var db = services.GetRequiredService<ApplicationDbContext>();
        var users = services.GetRequiredService<UserManager<ApplicationUser>>();
        var cache = services.GetRequiredService<IDistributedCache>();
        var mapper = services.GetRequiredService<ICvReadMapper>();
        var now = DateTime.UtcNow;

        if (!options.Apply)
        {
            await PrintPlanAsync(db, users, logger);
            return;
        }

        if (options.Clean)
        {
            await CleanAsync(db, users, logger);
            return;
        }

        var data = await EnsureReferenceDataAsync(db, logger);
        var jobs = await SeedJobsAsync(db, data, now, logger);
        var candidates = await SeedCandidatesAsync(db, users, data, now, logger);
        var applications = await SeedApplicationsAsync(db, mapper, data, jobs, candidates, now, logger);
        var scored = await ScoreMatchesAsync(db, jobs, candidates, now, logger);
        await BackdateAsync(db, jobs, candidates, applications, logger);
        await RecommendationCache.InvalidateJobsAsync(cache, default);
        await RecommendationCache.InvalidateCandidatePoolAsync(cache, default);

        logger.LogInformation(
            "Seed demo hoàn tất: {Jobs} tin tạo mới, {Candidates} ứng viên tạo mới, {Apps} đơn ứng tuyển, {Scored} cặp điểm phù hợp.",
            jobs.Count(x => x.IsNew), candidates.Count(x => x.IsNew), applications.Count(x => x.IsNew), scored);
    }

    // =====================================================================
    // 0. Kế hoạch (chạy không có --apply)
    // =====================================================================
    private static async Task PrintPlanAsync(ApplicationDbContext db, UserManager<ApplicationUser> users, ILogger logger)
    {
        var companies = await db.DoanhNghieps.AsNoTracking()
            .Where(x => x.MaSoThue != null && x.MaSoThue != "")
            .Select(x => new { x.Id, x.MaSoThue })
            .ToListAsync();
        var knownTaxCodes = companies.Select(x => x.MaSoThue!).ToHashSet(StringComparer.Ordinal);
        var missingCompanies = DemoCompanies.All.Count(c => !knownTaxCodes.Contains(c.TaxCode));
        var companyIdByTax = companies
            .Where(x => x.MaSoThue != null)
            .ToDictionary(x => x.MaSoThue!, x => x.Id, StringComparer.Ordinal);

        var skillNames = await db.KyNangs.AsNoTracking().Select(x => x.TenKyNang).ToListAsync();
        var missingSkills = DemoCompanies.ExtraSkills.Count(s => !skillNames.Contains(s.Name, StringComparer.Ordinal));

        var categoryNames = await db.DanhMucNghes.AsNoTracking().Select(x => x.TenNghe).ToListAsync();
        var wantedCategories = DemoFamilies.All.Select(f => f.Category).Distinct(StringComparer.Ordinal).ToList();
        var missingCategories = wantedCategories.Count(c => !categoryNames.Contains(c, StringComparer.Ordinal));

        var existingJobs = await db.TinTuyenDungs.AsNoTracking()
            .Select(x => new { x.DoanhNghiepId, x.TieuDe }).ToListAsync();
        var jobsToCreate = DemoJobCatalog.All.Count(def =>
            companyIdByTax.TryGetValue(def.CompanyTaxCode, out var companyId) &&
            !existingJobs.Any(j => j.DoanhNghiepId == companyId && j.TieuDe == def.Title));

        var existingDemoUsers = 0;
        foreach (var index in Enumerable.Range(0, DemoCandidateCatalog.All.Length))
            if (await users.FindByEmailAsync(DemoCandidateCatalog.EmailOf(index)) != null) existingDemoUsers++;

        logger.LogInformation(
            "KẾ HOẠCH SEED DEMO (dry-run, không ghi dữ liệu):\n" +
            "  Doanh nghiệp thiếu: {MissingCompanies}/{TotalCompanies}\n" +
            "  Kỹ năng nghiệp vụ thiếu: {MissingSkills}/{TotalSkills}\n" +
            "  Danh mục nghề thiếu: {MissingCategories}/{TotalCategories}\n" +
            "  Tin sẽ tạo: {JobsToCreate}/{TotalJobs}\n" +
            "  Ứng viên demo đã tồn tại: {ExistingUsers}/{TotalCandidates}",
            missingCompanies, DemoCompanies.All.Length, missingSkills, DemoCompanies.ExtraSkills.Length,
            missingCategories, wantedCategories.Count, jobsToCreate, DemoJobCatalog.All.Length,
            existingDemoUsers, DemoCandidateCatalog.All.Length);
        logger.LogInformation("Thêm --apply để ghi thật, --apply --clean để xoá dữ liệu demo.");
    }

    // =====================================================================
    // 1. Danh mục tham chiếu: doanh nghiệp, kỹ năng, ngành nghề, nhân sự
    // =====================================================================
    private sealed class SeedData
    {
        public Dictionary<string, DoanhNghiep> Companies { get; } = new(StringComparer.Ordinal);
        public Dictionary<string, DemoCompanyContent> CompanyContent { get; } = new(StringComparer.Ordinal);
        public Dictionary<string, int> SkillIds { get; } = new(StringComparer.Ordinal);
        public Dictionary<string, int> CategoryIds { get; } = new(StringComparer.Ordinal);
        public Dictionary<int, int[]> HrIds { get; } = new();
    }

    private static async Task<SeedData> EnsureReferenceDataAsync(ApplicationDbContext db, ILogger logger)
    {
        var data = new SeedData();
        var now = DateTime.UtcNow;

        // --- Kỹ năng nghiệp vụ bổ sung (idempotent theo tên) ---
        var skillNames = (await db.KyNangs.AsNoTracking().Select(x => x.TenKyNang).ToListAsync())
            .ToHashSet(StringComparer.Ordinal);
        var addedSkills = 0;
        foreach (var extra in DemoCompanies.ExtraSkills)
        {
            if (!skillNames.Add(extra.Name)) continue;
            db.KyNangs.Add(new DanhMucKyNang { TenKyNang = extra.Name, MoTa = extra.Description });
            addedSkills++;
        }
        if (addedSkills > 0) await db.SaveChangesAsync();

        // --- Ngành nghề cho các nhóm ngoài danh mục CNTT ---
        var categories = await db.DanhMucNghes.AsTracking().ToListAsync();
        var addedCategories = 0;
        foreach (var name in DemoFamilies.All.Select(f => f.Category).Distinct(StringComparer.Ordinal))
        {
            if (categories.Any(x => x.TenNghe == name)) continue;
            var category = new DanhMucNghe
            {
                TenNghe = name,
                MoTa = $"Ngành nghề demo: {name}.",
                IsActive = true
            };
            db.DanhMucNghes.Add(category);
            categories.Add(category);
            addedCategories++;
        }
        if (addedCategories > 0) await db.SaveChangesAsync();

        // --- Doanh nghiệp seed: làm giàu mô tả placeholder, không đổi tên ---
        var companies = await db.DoanhNghieps.AsTracking().ToListAsync();
        var enriched = 0;
        foreach (var content in DemoCompanies.All)
        {
            var dn = companies.FirstOrDefault(x => x.MaSoThue == content.TaxCode);
            if (dn == null)
            {
                logger.LogWarning("Không thấy doanh nghiệp MST {TaxCode}; bỏ qua nội dung demo của công ty này.", content.TaxCode);
                continue;
            }

            if (string.IsNullOrWhiteSpace(dn.MoTa) || dn.MoTa.StartsWith("Doanh nghiệp demo", StringComparison.Ordinal))
            {
                dn.MoTa = content.Description;
                dn.LinhVucHoatDong = content.Industry;
                dn.QuyMoNhanSu = content.Size;
                dn.DiaChi = content.Address;
                dn.Website = content.Website;
                enriched++;
            }
            data.Companies[content.TaxCode] = dn;
            data.CompanyContent[content.TaxCode] = content;
        }
        if (enriched > 0) await db.SaveChangesAsync();

        // --- Tra cứu id sau khi lưu ---
        foreach (var skill in await db.KyNangs.AsNoTracking().ToListAsync())
            data.SkillIds[skill.TenKyNang] = skill.Id;
        foreach (var category in await db.DanhMucNghes.AsNoTracking().ToListAsync())
            data.CategoryIds.TryAdd(category.TenNghe, category.Id);

        // --- Nhân sự theo doanh nghiệp (phân bổ người đăng tin / người xử lý) ---
        var hrRows = await (from profile in db.HoSoNhaTuyenDungs.AsNoTracking()
                            join user in db.NguoiDungs.AsNoTracking() on profile.NguoiDungId equals user.Id
                            where user.VaiTro == VaiTroNguoiDung.NHAN_SU && user.IsActive
                            select new { profile.DoanhNghiepId, user.Id })
            .ToListAsync();
        foreach (var group in hrRows.GroupBy(x => x.DoanhNghiepId))
            data.HrIds[group.Key] = group.Select(x => x.Id).OrderBy(x => x).ToArray();

        logger.LogInformation(
            "Tham chiếu demo: +{Skills} kỹ năng, +{Categories} ngành nghề, làm giàu {Companies} doanh nghiệp.",
            addedSkills, addedCategories, enriched);
        return data;
    }

    // =====================================================================
    // 2. Tin tuyển dụng
    // =====================================================================
    private sealed record JobSeed(
        int Id, DemoJobDef Def, DemoFamily Family, int DoanhNghiepId, int PostedById,
        DateTime CreatedAt, bool IsNew);

    private static async Task<List<JobSeed>> SeedJobsAsync(
        ApplicationDbContext db, SeedData data, DateTime now, ILogger logger)
    {
        var companyIds = data.Companies.Values.Select(x => x.Id).ToList();
        var existing = await db.TinTuyenDungs.AsTracking()
            .Where(t => companyIds.Contains(t.DoanhNghiepId))
            .ToListAsync();

        var seeds = new List<JobSeed>();
        var created = 0;
        foreach (var def in DemoJobCatalog.All)
        {
            if (!data.Companies.TryGetValue(def.CompanyTaxCode, out var company))
            {
                logger.LogWarning("Bỏ qua tin '{Title}': không có doanh nghiệp MST {Tax}.", def.Title, def.CompanyTaxCode);
                continue;
            }

            var family = DemoFamilies.Get(def.Family);
            var content = data.CompanyContent[def.CompanyTaxCode];
            var job = existing.FirstOrDefault(t => t.DoanhNghiepId == company.Id && t.TieuDe == def.Title);
            var createdAt = now.AddDays(-def.CreatedDaysAgo);

            if (job != null)
            {
                seeds.Add(new JobSeed(job.Id, def, family, company.Id, job.NguoiDangTinId, job.Created, false));
                continue;
            }

            var hrIds = data.HrIds.GetValueOrDefault(company.Id, []);
            var postedBy = hrIds.Length > 0
                ? hrIds[seeds.Count % hrIds.Length]
                : company.NguoiDaiDienId ?? 0;
            var (approved, screening) = ScreeningOf(def.Status);

            job = new TinTuyenDung
            {
                DoanhNghiepId = company.Id,
                DanhMucNgheId = data.CategoryIds[family.Category],
                NguoiDangTinId = postedBy,
                TieuDe = def.Title,
                MoTaCongViec = ComposeDescription(family, content),
                KinhNghiemYeuCau = ComposeExperience(family, def.Level),
                YeuCauCongViec = ComposeRequirements(family),
                QuyenLoi = ComposeBenefits(content),
                DiaDiemLamViec = def.Location,
                PhuongThucLamViec = def.Mode,
                LuongToiThieu = def.Min,
                LuongToiDa = def.Max,
                TrangThai = def.Status,
                NgayHetHan = DateTime.SpecifyKind(now.Date.AddDays(def.ExpiryInDays).AddHours(17), DateTimeKind.Utc),
                NguoiDaiDienDaDuyet = approved,
                KetQuaSangLoc = screening,
                QuatUngVienLucCuoi = def.Status == TrangThaiTinTuyenDung.DangTuyen ? now : null,
                KyNangTinTuyenDungs = BuildJobSkills(family, data)
            };
            db.TinTuyenDungs.Add(job);
            await db.SaveChangesAsync();
            created++;
            seeds.Add(new JobSeed(job.Id, def, family, company.Id, job.NguoiDangTinId, createdAt, true));
        }

        logger.LogInformation("Tin tuyển dụng: {Created} tin tạo mới, {Existing} tin đã có.", created, seeds.Count - created);
        return seeds;
    }

    private static List<KyNangTinTuyenDung> BuildJobSkills(DemoFamily family, SeedData data)
    {
        var list = new List<KyNangTinTuyenDung>();
        foreach (var (name, level) in family.Requirements)
        {
            if (!data.SkillIds.TryGetValue(name, out var skillId)) continue;
            list.Add(new KyNangTinTuyenDung { KyNangId = skillId, MucDoYeuCau = level });
        }
        return list;
    }

    private static (bool Approved, string Screening) ScreeningOf(TrangThaiTinTuyenDung status) => status switch
    {
        TrangThaiTinTuyenDung.DangTuyen or TrangThaiTinTuyenDung.TamDung or TrangThaiTinTuyenDung.HetHan
            or TrangThaiTinTuyenDung.DaDong or TrangThaiTinTuyenDung.BiKhoa
            => (true, "Đạt kiểm duyệt tự động."),
        TrangThaiTinTuyenDung.ChoAdminDuyet
            => (false, "Đạt kiểm duyệt tự động, chờ quản trị viên phê duyệt."),
        TrangThaiTinTuyenDung.ChoNguoiDaiDienDuyet
            => (false, "Đạt kiểm duyệt tự động, chờ người đại diện doanh nghiệp duyệt."),
        TrangThaiTinTuyenDung.TuChoi
            => (false, "Tin chưa đạt yêu cầu kiểm duyệt nội dung."),
        _ => (false, "")
    };

    private static string ComposeDescription(DemoFamily family, DemoCompanyContent company)
    {
        var lines = new List<string>
        {
            family.Summary,
            family.TeamContext,
            $"Sản phẩm và dịch vụ: {company.ProductContext}."
        };
        lines.AddRange(family.ResponsibilityBullets.Take(4));
        lines.Add("Bạn sẽ được tham gia đào tạo nội bộ, có lộ trình phát triển rõ ràng và làm việc trực tiếp với quản lý chuyên môn.");
        return string.Join("\n", lines);
    }

    private static string ComposeExperience(DemoFamily family, string level)
    {
        var text = level switch
        {
            "Junior" => "Từ 1 năm kinh nghiệm ở vị trí tương đương; chấp nhận ứng viên mới tốt nghiệp có dự án thực tế.",
            "Mid" => "Từ 2 đến 3 năm kinh nghiệm ở vị trí tương đương, đã làm việc trong nhóm chuyên nghiệp.",
            "Senior" => "Từ 4 đến 5 năm kinh nghiệm; ưu tiên ứng viên đã dẫn dắt nhóm hoặc sở hữu module lớn.",
            _ => "Không yêu cầu kinh nghiệm; ưu tiên ứng viên có dự án thực tế."
        };
        return text + "\n" + $"{family.TeamContext} Kinh nghiệm gần với {family.Position.ToLowerInvariant()} tại doanh nghiệp cùng ngành là lợi thế.";
    }

    private static string ComposeRequirements(DemoFamily family)
    {
        var lines = new List<string>(family.RequirementBullets);
        var core = family.Requirements
            .Where(x => x.Level != MucDoYC.KhongBatBuoc)
            .Select(x => x.Skill)
            .Take(6)
            .ToList();
        if (core.Count > 0)
            lines.Add("Kỹ năng chính: " + string.Join(", ", core) + ".");
        return string.Join("\n", lines);
    }

    private static string ComposeBenefits(DemoCompanyContent company)
    {
        var lines = new List<string>(company.Benefits)
        {
            "Thời gian thử việc 2 tháng hưởng 85% lương, đánh giá chính thức sau 6 tháng.",
            "Môi trường làm việc chuyên nghiệp, được cung cấp thiết bị và công cụ đầy đủ."
        };
        return string.Join("\n", lines);
    }

    // =====================================================================
    // 3. Ứng viên + CV
    // =====================================================================
    private sealed record CandidateSeed(
        int Index, DemoCandidateDef Def, DemoFamily Family,
        int NguoiDungId, int ProfileId, int CvId, DateTime CvCreatedAt, bool IsNew);

    private static async Task<List<CandidateSeed>> SeedCandidatesAsync(
        ApplicationDbContext db, UserManager<ApplicationUser> users, SeedData data, DateTime now, ILogger logger)
    {
        var seeds = new List<CandidateSeed>();
        var created = 0;

        for (var index = 0; index < DemoCandidateCatalog.All.Length; index++)
        {
            var def = DemoCandidateCatalog.All[index];
            var family = DemoFamilies.Get(def.Family);
            var email = DemoCandidateCatalog.EmailOf(index);

            var user = await users.FindByEmailAsync(email);
            if (user == null)
            {
                var nameParts = def.HoTen.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                user = new ApplicationUser
                {
                    UserName = DemoCandidateCatalog.UserNameOf(index),
                    Email = email,
                    FirstName = nameParts[^1],
                    LastName = string.Join(' ', nameParts[..^1]),
                    EmailConfirmed = true,
                    PhoneNumberConfirmed = true
                };
                var result = await users.CreateAsync(user, Password);
                if (!result.Succeeded)
                    throw new InvalidOperationException(
                        $"Không tạo được tài khoản demo {email}: {string.Join("; ", result.Errors.Select(e => e.Description))}");
            }
            if (!await users.IsInRoleAsync(user, VaiTroNguoiDung.UNG_VIEN.ToString()))
                await users.AddToRoleAsync(user, VaiTroNguoiDung.UNG_VIEN.ToString());

            var nguoiDung = await db.NguoiDungs.AsTracking()
                .FirstOrDefaultAsync(x => x.ApplicationUserId == user.Id);
            if (nguoiDung == null)
            {
                nguoiDung = new NguoiDung
                {
                    ApplicationUserId = user.Id,
                    VaiTro = VaiTroNguoiDung.UNG_VIEN,
                    IsActive = true
                };
                db.NguoiDungs.Add(nguoiDung);
                await db.SaveChangesAsync();
            }

            var cvCreatedAt = now.AddDays(-(70 + (index * 3) % 40));
            var profile = await db.HoSoUngViens.AsTracking()
                .FirstOrDefaultAsync(x => x.NguoiDungId == nguoiDung.Id);
            if (profile == null)
            {
                profile = new HoSoUngVien
                {
                    NguoiDungId = nguoiDung.Id,
                    HoTen = def.HoTen,
                    SDT = PhoneOf(index),
                    NgaySinh = BirthDate(def, index),
                    GioiTinh = def.Gender,
                    DiaChi = def.City,
                    GioiThieu = family.Summary,
                    ViTriUngTuyen = family.Position,
                    MucLuongMongMuon = def.Salary,
                    IsTimViec = true,
                    KinhNghiemLamViecs = new List<KinhNghiemLamViec>
                    {
                        new()
                        {
                            TenCongTy = family.Employers[index % family.Employers.Length],
                            DiaChi = def.City,
                            TuNgay = now.AddMonths(-Math.Max(6, (int)Math.Round(def.Years * 12))),
                            DenNgay = null,
                            MoTa = family.ExperienceBullets[index % family.ExperienceBullets.Length],
                            IsHienTai = true
                        }
                    }
                };
                db.HoSoUngViens.Add(profile);
                await db.SaveChangesAsync();
            }

            var cvName = $"CV-{SlugOf(family.Position)}-{index + 1:00}.pdf";
            var cv = await db.CVUngViens.AsTracking()
                .FirstOrDefaultAsync(x => x.HoSoUngVienId == profile.Id && x.TenFile == cvName);
            var wasNew = false;
            if (cv == null)
            {
                cv = BuildCv(index, def, family, data, now, cvName);
                cv.HoSoUngVienId = profile.Id;
                db.CVUngViens.Add(cv);
                await db.SaveChangesAsync();
                wasNew = true;
                created++;

                await EnsureProfileSkillsAsync(db, profile.Id, family, data, def);
            }

            seeds.Add(new CandidateSeed(index, def, family, nguoiDung.Id, profile.Id, cv.Id, cvCreatedAt, wasNew));
        }

        logger.LogInformation("Ứng viên demo: {Created} hồ sơ mới, {Total} hồ sơ sẵn sàng.", created, seeds.Count);
        return seeds;
    }

    private static CVUngVien BuildCv(
        int index, DemoCandidateDef def, DemoFamily family, SeedData data, DateTime now, string cvName)
    {
        var levelIndex = def.Level switch { "Junior" => 0, "Senior" => 2, _ => 1 };
        var totalMonths = Math.Max(6, (int)Math.Round(def.Years * 12));
        var currentMonths = def.Years >= 3 ? Math.Max(6, (int)(totalMonths * 0.45)) : totalMonths;
        var previousMonths = totalMonths - currentMonths;
        var currentStart = now.AddMonths(-currentMonths);
        var currentTitle = family.CareerTitles[levelIndex];
        var previousTitle = family.CareerTitles[Math.Max(0, levelIndex - 1)];
        var currentEmployer = family.Employers[index % family.Employers.Length];
        var previousEmployer = family.Employers[(index + 1) % family.Employers.Length];

        List<string> Bullets(int offset, int count) =>
            Enumerable.Range(0, count)
                .Select(k => family.ExperienceBullets[(index + offset + k) % family.ExperienceBullets.Length])
                .ToList();

        var cv = new CVUngVien
        {
            TenFile = cvName,
            FileUrl = "",
            StorageKey = "",
            FileMimeType = "application/pdf",
            FileSize = 180_000,
            TemplateId = family.TemplateId,
            PhuongThucTao = PhuongThucTaoCV.ThuCongTemplate,
            CauHinhJson = null,
            IsDefault = true,
            IsDaXoa = false,
            ThongTinLienHe = new CVThongTinLienHe
            {
                HoTen = def.HoTen,
                Email = DemoCandidateCatalog.EmailOf(index),
                SDT = PhoneOf(index),
                DiaChi = def.City,
                GitHub = family.TemplateId is "tech-modern" or "data-specialist" ? $"https://github.com/demo-{index + 1:00}" : null,
                LinkedIn = $"https://www.linkedin.com/in/demo-{index + 1:00}",
                Portfolio = family.Key == "design" ? $"https://www.behance.net/demo-{index + 1:00}" : null,
                GioiTinh = def.Gender,
                NgaySinh = BirthDate(def, index),
                ViTriUngTuyen = family.Position,
                MucLuongMongMuon = (decimal)def.Salary,
                GioiThieuBanThan =
                    $"{def.Years:0.#} năm kinh nghiệm ở vị trí {family.Position.ToLowerInvariant()}. " +
                    $"{family.ExperienceBullets[index % family.ExperienceBullets.Length]} " +
                    "Mong muốn làm việc trong môi trường chuyên nghiệp, được học hỏi và đóng góp lâu dài.",
                AnhDaiDienUrl = null
            },
            HocVans = new List<CVHocVan>
            {
                new()
                {
                    Truong = Schools[(index + levelIndex) % Schools.Length],
                    ChuyenNganh = family.Major,
                    BangCap = "Đại học",
                    TuNam = (short)(def.BirthYear + 18),
                    DenNam = (short)(def.BirthYear + 22),
                    IsHienTai = false,
                    MoTa = $"Chuyên ngành {family.Major}, tốt nghiệp loại Khá.",
                    ThuTu = 0
                }
            },
            KyNangs = BuildCvSkills(family, data, def),
            ChungChis = BuildCertificates(index, family, def, now)
        };

        var currentExperience = new CVKinhNghiemLamViec
        {
            CongTy = currentEmployer,
            ChucDanh = currentTitle,
            DiaChi = def.City,
            TuThang = currentStart.Month,
            TuNam = currentStart.Year,
            DenThang = null,
            DenNam = null,
            IsHienTai = true,
            MoTa = string.Join("\n", Bullets(0, 3)),
            ThuTu = 0
        };
        var linkSkills = family.Requirements.Take(3)
            .Select(x => data.SkillIds.TryGetValue(x.Skill, out var id) ? id : 0)
            .Where(id => id > 0)
            .Distinct()
            .ToList();
        foreach (var skillId in linkSkills)
        {
            currentExperience.KyNangs ??= new List<CVKinhNghiemKyNang>();
            currentExperience.KyNangs.Add(new CVKinhNghiemKyNang
            {
                KyNangId = skillId,
                TenKyNang = data.SkillIds.FirstOrDefault(x => x.Value == skillId).Key
            });
        }
        cv.KinhNghiems = new List<CVKinhNghiemLamViec> { currentExperience };

        if (previousMonths >= 6)
        {
            var previousStart = currentStart.AddMonths(-previousMonths);
            cv.KinhNghiems.Add(new CVKinhNghiemLamViec
            {
                CongTy = previousEmployer,
                ChucDanh = previousTitle,
                DiaChi = def.City,
                TuThang = previousStart.Month,
                TuNam = previousStart.Year,
                DenThang = currentStart.Month,
                DenNam = currentStart.Year,
                IsHienTai = false,
                MoTa = string.Join("\n", Bullets(1, 2)),
                ThuTu = 1
            });
        }

        var project = new CVDuAn
        {
            TenDuAn = family.ProjectNames[index % family.ProjectNames.Length],
            VaiTro = currentTitle,
            Link = null,
            MoTa = family.ProjectIntros[index % family.ProjectIntros.Length],
            TuThang = (short)currentStart.Month,
            TuNam = (short)currentStart.Year,
            DenThang = null,
            DenNam = null,
            IsHienTai = true,
            ThuTu = 0
        };
        foreach (var skillId in linkSkills)
        {
            project.CongNghes.Add(new CVDuAnCongNghe
            {
                KyNangId = skillId,
                TenCongNghe = data.SkillIds.FirstOrDefault(x => x.Value == skillId).Key
            });
        }
        cv.DuAns = new List<CVDuAn> { project };

        return cv;
    }

    private static List<CVKyNang> BuildCvSkills(DemoFamily family, SeedData data, DemoCandidateDef def)
    {
        var level = def.Level;
        var skills = new List<CVKyNang>();
        var order = 0;
        foreach (var (name, requirement) in family.Requirements)
        {
            if (!data.SkillIds.TryGetValue(name, out var skillId)) continue;
            var mucDo = level switch
            {
                "Junior" => order < 3 ? MucDo.CoBan : MucDo.TrungBinh,
                "Senior" => order < 3 ? MucDo.ChuyenGia : MucDo.ThanhThao,
                _ => order < 3 ? MucDo.TrungBinh : MucDo.ThanhThao
            };
            var years = MathF.Round(MathF.Max(0.5f, def.Years - order * 0.2f), 1);
            skills.Add(new CVKyNang
            {
                KyNangId = skillId,
                TenKyNang = name,
                MucDoThanhThao = mucDo,
                SoNamKinhNghiem = years,
                ThuTu = order
            });
            order++;
            if (requirement == MucDoYC.KhongBatBuoc && order >= 10) break;
        }
        return skills;
    }

    private static List<CVChungChi> BuildCertificates(int index, DemoFamily family, DemoCandidateDef def, DateTime now)
    {
        var count = def.Level == "Junior" ? 1 : 2;
        var list = new List<CVChungChi>();
        for (var i = 0; i < Math.Min(count, family.Certifications.Length); i++)
        {
            list.Add(new CVChungChi
            {
                TenChungChi = family.Certifications[i],
                DonViCap = "Tổ chức cấp chứng chỉ chuyên môn",
                NgayCap = now.AddYears(-(def.Years >= 4 ? 3 : 1)).AddMonths(-i),
                NgayHetHan = null,
                MaXacMinh = $"DEMO-{index + 1:00}-{i + 1}",
                CredentialUrl = "",
                ThuTu = i
            });
        }
        return list;
    }

    private static async Task EnsureProfileSkillsAsync(
        ApplicationDbContext db, int profileId, DemoFamily family, SeedData data, DemoCandidateDef def)
    {
        if (await db.KyNangUngViens.AsNoTracking().AnyAsync(x => x.HoSoUngVienId == profileId)) return;

        var level = def.Level switch
        {
            "Junior" => MucDo.CoBan,
            "Senior" => MucDo.ChuyenGia,
            _ => MucDo.TrungBinh
        };
        foreach (var (name, _) in family.Requirements.Take(6))
        {
            if (!data.SkillIds.TryGetValue(name, out var skillId)) continue;
            db.KyNangUngViens.Add(new KyNangUngVien
            {
                HoSoUngVienId = profileId,
                KyNangId = skillId,
                MucDoThongThao = level,
                SoNamKinhNghiem = MathF.Max(0.5f, def.Years * 0.8f)
            });
        }
        await db.SaveChangesAsync();
    }

    private static string PhoneOf(int index) => $"09{index + 11:00}7{index * 37 % 1000:000}1";

    private static DateTime BirthDate(DemoCandidateDef def, int index) =>
        new(def.BirthYear, (index % 12) + 1, (index * 3 % 27) + 1, 0, 0, 0, DateTimeKind.Utc);

    private static string SlugOf(string value) =>
        string.Join('-', value.ToLowerInvariant()
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(part => new string(part.Where(char.IsLetterOrDigit).ToArray()))
            .Where(part => part.Length > 0));

    // =====================================================================
    // 4. Đơn ứng tuyển + lịch sử + đánh giá
    // =====================================================================
    private sealed record ApplicationSeed(
        DonUngTuyen Entity, int CandidateIndex, int JobId, DateTime AppliedAt,
        DateTime LastEventAt, DateTime? DecisionAt, IReadOnlyList<DateTime> HistoryTimes, bool IsNew);

    private static async Task<List<ApplicationSeed>> SeedApplicationsAsync(
        ApplicationDbContext db, ICvReadMapper mapper, SeedData data,
        List<JobSeed> jobs, List<CandidateSeed> candidates, DateTime now, ILogger logger)
    {
        var recevableStatuses = new[]
        {
            TrangThaiTinTuyenDung.DangTuyen, TrangThaiTinTuyenDung.TamDung,
            TrangThaiTinTuyenDung.HetHan, TrangThaiTinTuyenDung.DaDong
        };
        var recevableJobs = jobs.Where(j => recevableStatuses.Contains(j.Def.Status)).ToList();

        var cvIds = candidates.Select(c => c.CvId).ToList();
        var cvGraphs = await db.CVUngViens.AsNoTracking().AsSplitQuery()
            .Include(x => x.ThongTinLienHe)
            .Include(x => x.HocVans)
            .Include(x => x.KyNangs)
            .Include(x => x.ChungChis)
            .Include(x => x.KinhNghiems).ThenInclude(x => x.KyNangs)
            .Include(x => x.DuAns).ThenInclude(x => x.CongNghes)
            .Include(x => x.HoSoUngVien)
            .Where(x => cvIds.Contains(x.Id))
            .ToListAsync();
        var cvById = cvGraphs.ToDictionary(x => x.Id);

        var existingPairs = (await db.DonUngTuyens.AsNoTracking()
                .Where(d => cvIds.Contains(d.CVUngVienId))
                .Select(d => new { d.TinTuyenDungId, d.CVUngVienId })
                .ToListAsync())
            .Select(x => (x.TinTuyenDungId, x.CVUngVienId))
            .ToHashSet();
        // Hạn mức 12 đơn/ứng viên tính trên toàn DB (không chỉ đơn tạo trong lượt này)
        // để chạy lại --apply không sinh thêm đơn từ các cặp từng bị chặn.
        var existingPerCv = existingPairs.GroupBy(x => x.CVUngVienId)
            .ToDictionary(g => g.Key, g => g.Count());

        var byFamily = candidates.GroupBy(c => c.Def.Family)
            .ToDictionary(g => g.Key, g => g.ToList(), StringComparer.Ordinal);
        var appsPerCandidate = candidates
            .Select(c => existingPerCv.GetValueOrDefault(c.CvId))
            .ToArray();
        var seeds = new List<ApplicationSeed>();
        var created = 0;

        foreach (var (job, jobIndex) in recevableJobs.Select((j, i) => (j, i)))
        {
            var rng = new Random(20261123 + jobIndex * 17);
            var closed = job.Def.Status is TrangThaiTinTuyenDung.HetHan or TrangThaiTinTuyenDung.DaDong;
            var desired = closed ? 3 + rng.Next(3) : 4 + rng.Next(4);
            var chosen = PickCandidates(job, candidates, byFamily, rng, desired);

            foreach (var (candidate, slot) in chosen.Select((c, i) => (c, i)))
            {
                if (appsPerCandidate[candidate.Index] >= 12) continue;
                if (existingPairs.Contains((job.Id, candidate.CvId))) continue;
                if (!cvById.TryGetValue(candidate.CvId, out var cv)) continue;

                var (status, daysAgo) = PickStatus(job, closed, slot, rng);
                var appliedAt = now.AddDays(-daysAgo).AddHours(-rng.Next(0, 20));
                var earliest = job.CreatedAt.AddHours(2);
                if (appliedAt < earliest) appliedAt = earliest;
                if (appliedAt > now.AddHours(-2)) appliedAt = now.AddHours(-2);

                var application = new DonUngTuyen
                {
                    TinTuyenDungId = job.Id,
                    CVUngVienId = candidate.CvId,
                    CVPhienBanId = null,
                    HoSoUngVienId = candidate.ProfileId,
                    DoanhNghiepId = job.DoanhNghiepId,
                    CvSnapshotJson = JsonSerializer.Serialize(mapper.Map(cv)),
                    NguoiXuLyId = 0,
                    GhiChu = "",
                    TrangThai = status,
                    NgayUngTuyen = appliedAt
                };

                var events = BuildEvents(application, job, candidate, status, appliedAt, now, rng);
                var handled = status is TrangThaiDonUngTuyen.DaXem or TrangThaiDonUngTuyen.PhuHop or TrangThaiDonUngTuyen.TuChoi;
                if (handled) application.NguoiXuLyId = job.PostedById;
                var rejectNote = status == TrangThaiDonUngTuyen.TuChoi
                    ? DemoFeedback.RejectionNotes[(jobIndex + slot) % DemoFeedback.RejectionNotes.Length]
                    : "";
                if (rejectNote.Length > 0) application.GhiChu = rejectNote;
                else if (status == TrangThaiDonUngTuyen.PhuHop)
                    application.GhiChu = DemoFeedback.InvitationNotes[(jobIndex + slot) % DemoFeedback.InvitationNotes.Length];

                db.DonUngTuyens.Add(application);
                foreach (var (from, to, trigger, actor, note, at) in events)
                {
                    db.LichSuTrangThaiDonUngTuyens.Add(new LichSuTrangThaiDonUngTuyen
                    {
                        DonUngTuyen = application,
                        TrangThaiTruoc = from,
                        TrangThaiSau = to,
                        Trigger = trigger,
                        NguoiThucHienId = actor,
                        GhiChu = note,
                        Created = at
                    });
                }

                DateTime? decisionAt = null;
                if (status is TrangThaiDonUngTuyen.PhuHop or TrangThaiDonUngTuyen.TuChoi)
                {
                    decisionAt = events[^1].At.AddMinutes(20);
                    db.DanhGias.Add(new DanhGia
                    {
                        DonUngTuyen = application,
                        KetLuan = status == TrangThaiDonUngTuyen.PhuHop ? "Phù hợp" : "Chưa phù hợp",
                        NoiDungPhanHoi = status == TrangThaiDonUngTuyen.PhuHop
                            ? DemoFeedback.MatchNotes[(jobIndex + slot) % DemoFeedback.MatchNotes.Length]
                            : rejectNote,
                        NgayPhanHoi = decisionAt
                    });
                }

                appsPerCandidate[candidate.Index]++;
                created++;
                seeds.Add(new ApplicationSeed(application, candidate.Index, job.Id, appliedAt,
                    events[^1].At, decisionAt, events.Select(e => e.At).ToList(), true));
            }
        }

        await db.SaveChangesAsync();
        logger.LogInformation("Đơn ứng tuyển: {Created} đơn tạo mới trên {Jobs} tin nhận hồ sơ.",
            created, recevableJobs.Count);
        return seeds;
    }

    private static List<CandidateSeed> PickCandidates(
        JobSeed job, List<CandidateSeed> candidates, Dictionary<string, List<CandidateSeed>> byFamily,
        Random rng, int desired)
    {
        var ordered = new List<CandidateSeed>();
        if (byFamily.TryGetValue(job.Family.Key, out var same))
            ordered.AddRange(same.OrderBy(_ => rng.Next()));
        foreach (var adjacent in AdjacentFamilies.GetValueOrDefault(job.Family.Key, []))
            if (byFamily.TryGetValue(adjacent, out var group))
                ordered.AddRange(group.OrderBy(_ => rng.Next()));

        var chosenIndexes = ordered.Select(x => x.Index).ToHashSet();
        ordered.AddRange(candidates.Where(x => !chosenIndexes.Contains(x.Index)).OrderBy(_ => rng.Next()));
        return ordered.Take(desired).ToList();
    }

    private static (TrangThaiDonUngTuyen Status, int DaysAgo) PickStatus(
        JobSeed job, bool closed, int slot, Random rng)
    {
        var jobAge = Math.Max(1, job.Def.CreatedDaysAgo);

        if (closed)
        {
            var daysAgo = rng.Next(1, Math.Max(2, Math.Min(jobAge, 25)));
            var roll = rng.Next(100);
            var status = roll switch
            {
                < 50 => TrangThaiDonUngTuyen.PhuHop,
                < 85 => TrangThaiDonUngTuyen.TuChoi,
                _ => TrangThaiDonUngTuyen.TinTuyenDungBiDong
            };
            return (status, daysAgo);
        }

        if (jobAge <= 5)
        {
            var daysAgo = rng.Next(0, Math.Min(jobAge, 5) + 1);
            return (rng.Next(100) < 65 ? TrangThaiDonUngTuyen.ChoXuLy : TrangThaiDonUngTuyen.DaXem, daysAgo);
        }

        if (jobAge <= 11)
        {
            if (slot % 2 == 0)
                return (rng.Next(100) < 60 ? TrangThaiDonUngTuyen.ChoXuLy : TrangThaiDonUngTuyen.DaXem,
                    rng.Next(0, Math.Min(jobAge, 5) + 1));
            var roll = rng.Next(100);
            return (roll switch
            {
                < 35 => TrangThaiDonUngTuyen.DaXem,
                < 65 => TrangThaiDonUngTuyen.PhuHop,
                < 85 => TrangThaiDonUngTuyen.TuChoi,
                _ => TrangThaiDonUngTuyen.UngVienRutDon
            }, rng.Next(6, 12));
        }

        switch (slot % 4)
        {
            case 0:
                return (rng.Next(100) < 60 ? TrangThaiDonUngTuyen.ChoXuLy : TrangThaiDonUngTuyen.DaXem,
                    rng.Next(0, 5));
            case 1:
                return (rng.Next(100) < 50 ? TrangThaiDonUngTuyen.DaXem : TrangThaiDonUngTuyen.PhuHop,
                    rng.Next(6, 12));
            case 2:
                return (rng.Next(100) switch
                {
                    < 45 => TrangThaiDonUngTuyen.PhuHop,
                    < 80 => TrangThaiDonUngTuyen.TuChoi,
                    < 92 => TrangThaiDonUngTuyen.QuaHanXuLy,
                    _ => TrangThaiDonUngTuyen.UngVienRutDon
                }, rng.Next(12, Math.Min(jobAge, 25) + 1));
            default:
                return (rng.Next(100) switch
                {
                    < 45 => TrangThaiDonUngTuyen.PhuHop,
                    < 80 => TrangThaiDonUngTuyen.TuChoi,
                    < 92 => TrangThaiDonUngTuyen.QuaHanXuLy,
                    _ => TrangThaiDonUngTuyen.TinTuyenDungBiDong
                }, rng.Next(1, Math.Min(jobAge, 35) + 1));
        }
    }

    private static List<(TrangThaiDonUngTuyen From, TrangThaiDonUngTuyen To, TriggerDonUngTuyen Trigger,
        int? Actor, string Note, DateTime At)> BuildEvents(
        DonUngTuyen application, JobSeed job, CandidateSeed candidate,
        TrangThaiDonUngTuyen status, DateTime appliedAt, DateTime now, Random rng)
    {
        var events = new List<(TrangThaiDonUngTuyen, TrangThaiDonUngTuyen, TriggerDonUngTuyen, int?, string, DateTime)>();
        var acceptAt = appliedAt.AddMinutes(rng.Next(2, 10));
        events.Add((TrangThaiDonUngTuyen.KhoiTao, TrangThaiDonUngTuyen.ChoXuLy,
            TriggerDonUngTuyen.XuLyHoSoThanhCong, null,
            "Hồ sơ hợp lệ, chờ nhà tuyển dụng xử lý.", acceptAt));

        var hrId = job.PostedById > 0 ? job.PostedById : (int?)null;
        var viewedAt = default(DateTime);
        var hasViewed = status is TrangThaiDonUngTuyen.DaXem or TrangThaiDonUngTuyen.PhuHop
            || (status == TrangThaiDonUngTuyen.TuChoi && rng.Next(100) < 65);

        if (hasViewed)
        {
            var raw = acceptAt.AddHours(rng.Next(4, 30));
            var max = now.AddHours(-1);
            viewedAt = raw > max ? max : raw;
            if (viewedAt <= acceptAt) viewedAt = acceptAt.AddMinutes(30);
            events.Add((TrangThaiDonUngTuyen.ChoXuLy, TrangThaiDonUngTuyen.DaXem,
                TriggerDonUngTuyen.XemDon, hrId,
                DemoFeedback.ViewedNotes[(job.Id + rng.Next(100)) % DemoFeedback.ViewedNotes.Length], viewedAt));
        }

        switch (status)
        {
            case TrangThaiDonUngTuyen.PhuHop:
            {
                var at = MinTime(viewedAt.AddHours(rng.Next(12, 72)), now.AddMinutes(-30));
                if (at <= viewedAt) at = viewedAt.AddMinutes(30);
                events.Add((TrangThaiDonUngTuyen.DaXem, TrangThaiDonUngTuyen.PhuHop,
                    TriggerDonUngTuyen.DanhGiaPhuHop, hrId,
                    DemoFeedback.InvitationNotes[(job.Id + rng.Next(100)) % DemoFeedback.InvitationNotes.Length], at));
                break;
            }
            case TrangThaiDonUngTuyen.TuChoi:
            {
                var from = hasViewed ? TrangThaiDonUngTuyen.DaXem : TrangThaiDonUngTuyen.ChoXuLy;
                var baseline = hasViewed ? viewedAt : acceptAt;
                var at = MinTime(baseline.AddHours(rng.Next(8, 60)), now.AddMinutes(-20));
                if (at <= baseline) at = baseline.AddMinutes(30);
                events.Add((from, TrangThaiDonUngTuyen.TuChoi, TriggerDonUngTuyen.TuChoi, hrId,
                    DemoFeedback.RejectionNotes[(job.Id + rng.Next(100)) % DemoFeedback.RejectionNotes.Length], at));
                break;
            }
            case TrangThaiDonUngTuyen.UngVienRutDon:
            {
                var at = MinTime(acceptAt.AddHours(rng.Next(6, 48)), now.AddMinutes(-10));
                if (at <= acceptAt) at = acceptAt.AddMinutes(30);
                events.Add((TrangThaiDonUngTuyen.ChoXuLy, TrangThaiDonUngTuyen.UngVienRutDon,
                    TriggerDonUngTuyen.RutDon, null,
                    DemoFeedback.WithdrawNotes[(job.Id + rng.Next(100)) % DemoFeedback.WithdrawNotes.Length], at));
                break;
            }
            case TrangThaiDonUngTuyen.QuaHanXuLy:
            {
                var at = MinTime(appliedAt.AddDays(7).AddHours(1), now.AddMinutes(-5));
                if (at <= acceptAt) at = acceptAt.AddDays(7);
                events.Add((TrangThaiDonUngTuyen.ChoXuLy, TrangThaiDonUngTuyen.QuaHanXuLy,
                    TriggerDonUngTuyen.HetHanXuLy, null,
                    DemoFeedback.OverdueNotes[(job.Id + rng.Next(100)) % DemoFeedback.OverdueNotes.Length], at));
                break;
            }
            case TrangThaiDonUngTuyen.TinTuyenDungBiDong:
            {
                var closing = now.AddDays(job.Def.ExpiryInDays);
                if (closing <= appliedAt) closing = appliedAt.AddDays(1);
                var at = MinTime(closing, now.AddMinutes(-5));
                if (at <= acceptAt) at = acceptAt.AddMinutes(45);
                events.Add((TrangThaiDonUngTuyen.ChoXuLy, TrangThaiDonUngTuyen.TinTuyenDungBiDong,
                    TriggerDonUngTuyen.DongBoiTinTuyenDung, null,
                    DemoFeedback.ClosedJobNotes[(job.Id + rng.Next(100)) % DemoFeedback.ClosedJobNotes.Length], at));
                break;
            }
        }

        return events;
    }

    private static DateTime MinTime(DateTime left, DateTime right) => left < right ? left : right;

    // =====================================================================
    // 5. Điểm phù hợp (cbf) cho hai phía
    // =====================================================================
    private static async Task<int> ScoreMatchesAsync(
        ApplicationDbContext db, List<JobSeed> jobs, List<CandidateSeed> candidates,
        DateTime now, ILogger logger)
    {
        var jobIds = jobs.Select(j => j.Id).ToHashSet();
        var cvIds = candidates.Select(c => c.CvId).ToHashSet();

        var jobEntities = await db.TinTuyenDungs.AsNoTracking()
            .Include(x => x.KyNangTinTuyenDungs).ThenInclude(x => x.DanhMucKyNang)
            .Where(x => jobIds.Contains(x.Id))
            .ToListAsync();
        var cvEntities = await db.CVUngViens.AsNoTracking().AsSplitQuery()
            .Include(x => x.ThongTinLienHe)
            .Include(x => x.KyNangs)
            .Include(x => x.KinhNghiems)
            .Include(x => x.DuAns)
            .Include(x => x.HoSoUngVien)
            .Where(x => cvIds.Contains(x.Id))
            .ToListAsync();

        var candidateByCv = candidates.ToDictionary(x => x.CvId);
        var corpus = await SkillCorpusLoader.LoadAsync(db, now);

        JobMatchInput JobInputOf(TinTuyenDung job)
        {
            var requirements = job.KyNangTinTuyenDungs
                .Where(x => x.DanhMucKyNang != null && !string.IsNullOrWhiteSpace(x.DanhMucKyNang.TenKyNang))
                .Select(x => new MatchRequirement(x.KyNangId, x.DanhMucKyNang!.TenKyNang, x.MucDoYeuCau))
                .ToList();
            return new JobMatchInput(requirements, job.TieuDe, job.LuongToiThieu, job.LuongToiDa,
                job.DiaDiemLamViec, job.KinhNghiemYeuCau);
        }

        CandidateMatchInput CvInputOf(CVUngVien cv)
        {
            var skills = cv.KyNangs
                .Select(k => new MatchSkill(k.KyNangId, k.TenKyNang, k.MucDoThanhThao, k.SoNamKinhNghiem))
                .ToList();
            var salary = cv.ThongTinLienHe?.MucLuongMongMuon ?? (decimal)cv.HoSoUngVien.MucLuongMongMuon;
            return new CandidateMatchInput(skills, cv.ThongTinLienHe?.ViTriUngTuyen ?? cv.HoSoUngVien.ViTriUngTuyen,
                salary, cv.ThongTinLienHe?.DiaChi ?? cv.HoSoUngVien.DiaChi, CandidateEvidenceText.From(cv));
        }

        var inputs = cvEntities.ToDictionary(x => x.Id, CvInputOf);
        var evaluations = new Dictionary<(int JobId, int CvId), ContentMatchResult>();
        var activeJobs = jobEntities
            .Where(x => x.TrangThai == TrangThaiTinTuyenDung.DangTuyen &&
                        (x.NgayHetHan == null || x.NgayHetHan > now))
            .ToList();

        foreach (var job in activeJobs)
        {
            var jobInput = JobInputOf(job);
            foreach (var cv in cvEntities)
                evaluations[(job.Id, cv.Id)] = ContentBasedMatcher.Evaluate(inputs[cv.Id], jobInput, corpus);
        }

        var selected = new HashSet<(int JobId, int CvId)>();
        foreach (var job in activeJobs)
        {
            foreach (var pair in evaluations
                         .Where(x => x.Key.JobId == job.Id && x.Value.Score > 0)
                         .OrderByDescending(x => x.Value.Score)
                         .Take(10))
                selected.Add(pair.Key);
        }

        foreach (var cv in cvEntities)
        {
            foreach (var pair in evaluations
                         .Where(x => x.Key.CvId == cv.Id && x.Value.Score > 0)
                         .OrderByDescending(x => x.Value.Score)
                         .Take(3))
                selected.Add(pair.Key);
        }

        // Đơn đã nộp luôn có điểm, kể cả tin đã đóng (HR mở hồ sơ vẫn thấy điểm).
        // Lấy từ DB (không phải danh sách đơn tạo trong lượt này) để chạy lại
        // --apply vẫn làm mới điểm cho cả đơn cũ trên tin đã đóng.
        var jobById = jobEntities.ToDictionary(x => x.Id);
        var appPairs = await db.DonUngTuyens.AsNoTracking()
            .Where(d => cvIds.Contains(d.CVUngVienId))
            .Select(d => new { d.TinTuyenDungId, d.CVUngVienId })
            .Distinct()
            .ToListAsync();
        foreach (var pair in appPairs)
        {
            if (!jobById.TryGetValue(pair.TinTuyenDungId, out var job)) continue;
            if (!inputs.TryGetValue(pair.CVUngVienId, out var cvInput)) continue;
            var key = (pair.TinTuyenDungId, pair.CVUngVienId);
            if (!evaluations.ContainsKey(key))
                evaluations[key] = ContentBasedMatcher.Evaluate(cvInput, JobInputOf(job), corpus);
            selected.Add(key);
        }

        foreach (var (jobId, cvId) in selected)
        {
            if (!jobById.ContainsKey(jobId) || !candidateByCv.TryGetValue(cvId, out var candidate)) continue;
            await KetQuaPhuHopStore.UpsertAsync(db, candidate.ProfileId, cvId, jobId,
                evaluations[(jobId, cvId)], "Quét pool ứng viên khi tin đang tuyển.",
                "skill-overlap-weighted-normalized", default);
        }
        await db.SaveChangesAsync();

        logger.LogInformation("Điểm phù hợp: {Count} cặp (tin, CV) được chấm bằng {Version}.",
            selected.Count, ContentBasedMatcher.Version);
        return selected.Count;
    }

    // =====================================================================
    // 6. Lùi thời gian bằng SQL thô (audit ghi đè Created khi SaveChanges)
    // =====================================================================
    private static async Task BackdateAsync(
        ApplicationDbContext db, List<JobSeed> jobs, List<CandidateSeed> candidates,
        List<ApplicationSeed> applications, ILogger logger)
    {
        var updates = 0;
        foreach (var job in jobs.Where(x => x.IsNew))
        {
            await db.Database.ExecuteSqlRawAsync(
                "UPDATE \"TinTuyenDung\" SET \"Created\" = {0}, \"LastModified\" = {1} WHERE \"Id\" = {2}",
                job.CreatedAt, job.CreatedAt.AddHours(2), job.Id);
            updates++;
        }

        foreach (var candidate in candidates.Where(x => x.IsNew))
        {
            await db.Database.ExecuteSqlRawAsync(
                "UPDATE \"CVUngVien\" SET \"Created\" = {0}, \"LastModified\" = {1} WHERE \"Id\" = {2}",
                candidate.CvCreatedAt, candidate.CvCreatedAt.AddHours(1), candidate.CvId);
            await db.Database.ExecuteSqlRawAsync(
                "UPDATE \"HoSoUngVien\" SET \"Created\" = {0} WHERE \"Id\" = {1}",
                candidate.CvCreatedAt.AddDays(-5), candidate.ProfileId);
            await db.Database.ExecuteSqlRawAsync(
                "UPDATE \"NguoiDung\" SET \"Created\" = {0} WHERE \"Id\" = {1}",
                candidate.CvCreatedAt.AddDays(-5), candidate.NguoiDungId);
            updates += 3;
        }

        var newApps = applications.Where(x => x.IsNew).ToList();
        var newAppIds = newApps.Select(x => x.Entity.Id).ToList();

        // Lịch sử/đánh giá vừa tạo bị audit ghi đè Created về UtcNow, nên đọc lại id
        // (sắp theo Id = đúng thứ tự sự kiện) rồi gán mốc thời gian đã dựng.
        var historyByApp = (await db.LichSuTrangThaiDonUngTuyens.AsNoTracking()
                .Where(x => newAppIds.Contains(x.DonUngTuyenId))
                .Select(x => new { x.Id, x.DonUngTuyenId })
                .ToListAsync())
            .GroupBy(x => x.DonUngTuyenId)
            .ToDictionary(g => g.Key, g => g.OrderBy(x => x.Id).Select(x => x.Id).ToArray());
        var ratingByApp = (await db.DanhGias.AsNoTracking()
                .Where(x => newAppIds.Contains(x.DonUngTuyenId))
                .Select(x => new { x.Id, x.DonUngTuyenId })
                .ToListAsync())
            .ToDictionary(x => x.DonUngTuyenId, x => x.Id);

        foreach (var application in newApps)
        {
            await db.Database.ExecuteSqlRawAsync(
                "UPDATE \"DonUngTuyen\" SET \"Created\" = {0}, \"LastModified\" = {1}, \"NgayUngTuyen\" = {2} WHERE \"Id\" = {3}",
                application.AppliedAt, application.LastEventAt, application.AppliedAt, application.Entity.Id);
            updates++;

            if (historyByApp.TryGetValue(application.Entity.Id, out var historyIds))
            {
                var count = Math.Min(historyIds.Length, application.HistoryTimes.Count);
                if (count > 0)
                {
                    await db.Database.ExecuteSqlRawAsync(
                        "UPDATE \"LichSuTrangThaiDonUngTuyen\" AS h " +
                        "SET \"Created\" = u.ts, \"LastModified\" = u.ts " +
                        "FROM unnest({0}::integer[], {1}::timestamptz[]) AS u(id, ts) WHERE h.\"Id\" = u.id",
                        historyIds[..count], application.HistoryTimes.Take(count).ToArray());
                    updates += count;
                }
            }

            if (application.DecisionAt is { } decisionAt && ratingByApp.TryGetValue(application.Entity.Id, out var ratingId))
            {
                await db.Database.ExecuteSqlRawAsync(
                    "UPDATE \"DanhGia\" SET \"Created\" = {0}, \"LastModified\" = {0}, \"NgayPhanHoi\" = {0} WHERE \"Id\" = {1}",
                    decisionAt, ratingId);
                updates++;
            }
        }

        logger.LogInformation("Lùi thời gian: {Updates} dòng tin/CV/hồ sơ/đơn/lịch sử/đánh giá.", updates);
    }

    // =====================================================================
    // 7. Xoá dữ liệu demo (--apply --clean)
    // =====================================================================
    private static async Task CleanAsync(
        ApplicationDbContext db, UserManager<ApplicationUser> users, ILogger logger)
    {
        var demoUsers = await users.Users
            .Where(u => u.Email != null && u.Email.EndsWith(DemoEmailSuffix))
            .ToListAsync();
        var userIds = demoUsers.Select(u => u.Id).ToList();
        var nguoiDungs = await db.NguoiDungs.AsTracking()
            .Where(x => userIds.Contains(x.ApplicationUserId))
            .ToListAsync();
        var nguoiDungIds = nguoiDungs.Select(x => x.Id).ToList();

        var profiles = await db.HoSoUngViens.AsTracking()
            .Where(x => nguoiDungIds.Contains(x.NguoiDungId))
            .ToListAsync();
        var profileIds = profiles.Select(x => x.Id).ToList();
        var cvIds = await db.CVUngViens.AsNoTracking()
            .Where(x => profileIds.Contains(x.HoSoUngVienId))
            .Select(x => x.Id)
            .ToListAsync();

        var applications = await db.DonUngTuyens.AsTracking()
            .Where(x => (x.HoSoUngVienId != null && profileIds.Contains(x.HoSoUngVienId.Value)) ||
                        cvIds.Contains(x.CVUngVienId))
            .ToListAsync();
        db.DonUngTuyens.RemoveRange(applications);
        await db.SaveChangesAsync();

        var jobIds = new List<int>();
        foreach (var def in DemoJobCatalog.All)
        {
            var companyId = await db.DoanhNghieps.AsNoTracking()
                .Where(x => x.MaSoThue == def.CompanyTaxCode)
                .Select(x => (int?)x.Id)
                .FirstOrDefaultAsync();
            if (!companyId.HasValue) continue;
            var jobId = await db.TinTuyenDungs.AsNoTracking()
                .Where(x => x.DoanhNghiepId == companyId.Value && x.TieuDe == def.Title)
                .Select(x => (int?)x.Id)
                .FirstOrDefaultAsync();
            if (!jobId.HasValue) continue;

            var hasForeignApps = await db.DonUngTuyens.AsNoTracking()
                .AnyAsync(x => x.TinTuyenDungId == jobId.Value &&
                               (x.HoSoUngVienId == null || !profileIds.Contains(x.HoSoUngVienId.Value)));
            if (hasForeignApps)
            {
                logger.LogWarning("Giữ tin '{Title}' vì còn đơn ứng tuyển ngoài dữ liệu demo.", def.Title);
                continue;
            }
            jobIds.Add(jobId.Value);
        }

        var jobs = await db.TinTuyenDungs.AsTracking().Where(x => jobIds.Contains(x.Id)).ToListAsync();
        db.TinTuyenDungs.RemoveRange(jobs);
        await db.SaveChangesAsync();

        foreach (var profile in profiles)
            db.HoSoUngViens.Remove(profile);
        foreach (var nguoiDung in nguoiDungs)
            db.NguoiDungs.Remove(nguoiDung);
        await db.SaveChangesAsync();

        foreach (var user in demoUsers)
            await users.DeleteAsync(user);

        logger.LogInformation(
            "Dọn dữ liệu demo: xoá {Apps} đơn, {Jobs} tin, {Profiles} hồ sơ, {Users} tài khoản @demo.local.",
            applications.Count, jobs.Count, profiles.Count, demoUsers.Count);
    }
}
