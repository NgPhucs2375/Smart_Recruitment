using System.Text.Json;
using Application.Wrappers;
using Domain.Enums;
using Infrastructure.Identity.Contexts;
using Infrastructure.Persistence.Contexts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;

namespace WebApp.Server.Controllers;

[ApiController]
[Route("api/admin/dashboard")]
[Authorize(Roles = "QUAN_TRI_VIEN")]
public sealed class AdminDashboardController(
    ApplicationDbContext db,
    IdentityContext identityDb,
    IDistributedCache cache,
    IConnectionMultiplexer redis,
    HealthCheckService healthChecks) : ControllerBase
{
    private static readonly int[] AllowedPeriods = [7, 30, 90, 365];

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] int days = 30, CancellationToken cancellationToken = default)
    {
        if (!AllowedPeriods.Contains(days)) days = 30;

        var cacheKey = $"cache:admin-dashboard:v1:days:{days}";
        try
        {
            var cached = await cache.GetStringAsync(cacheKey, cancellationToken);
            if (!string.IsNullOrWhiteSpace(cached))
            {
                var cachedDashboard = JsonSerializer.Deserialize<AdminDashboardDto>(cached);
                if (cachedDashboard != null)
                    return Ok(new Response<AdminDashboardDto>(cachedDashboard));
            }
        }
        catch (RedisException)
        {
            // Dashboard data remains available from PostgreSQL when Redis is degraded.
        }

        var now = DateTime.UtcNow;
        var periodStart = now.Date.AddDays(-(days - 1));
        var previousStart = periodStart.AddDays(-days);

        var users = await db.NguoiDungs.AsNoTracking()
            .Select(x => new { x.Created, x.VaiTro, x.IsActive })
            .ToListAsync(cancellationToken);
        var companies = await db.DoanhNghieps.AsNoTracking()
            .Select(x => new { x.Id, x.TenDoanhNghiep, x.Created })
            .ToListAsync(cancellationToken);
        var jobs = await db.TinTuyenDungs.AsNoTracking()
            .Select(x => new
            {
                x.Id,
                x.TieuDe,
                x.Created,
                x.TrangThai,
                x.LuongToiThieu,
                x.LuongToiDa,
                Category = x.DanhMucNghe.TenNghe
            })
            .ToListAsync(cancellationToken);
        var applications = await db.DonUngTuyens.AsNoTracking()
            .Select(x => new
            {
                x.Id,
                Created = x.NgayUngTuyen ?? x.Created,
                x.TrangThai,
                JobTitle = x.TinTuyenDung.TieuDe
            })
            .ToListAsync(cancellationToken);
        var cvs = await db.CVUngViens.AsNoTracking()
            .Select(x => new { x.Id, x.TenFile, x.Created, x.PhuongThucTao, x.IsDaXoa })
            .ToListAsync(cancellationToken);

        var candidateLocations = await db.HoSoUngViens.AsNoTracking()
            .Where(x => x.DiaChi != null && x.DiaChi != "")
            .Select(x => x.DiaChi!)
            .ToListAsync(cancellationToken);
        var jobSkills = await db.KyNangTinTuyenDungs.AsNoTracking()
            .Where(x => x.TinTuyenDung.TrangThai == TrangThaiTinTuyenDung.DangTuyen)
            .Select(x => new { x.KyNangId, x.KyNang.TenKyNang })
            .ToListAsync(cancellationToken);
        var candidateSkills = await db.KyNangUngViens.AsNoTracking()
            .GroupBy(x => x.KyNangId)
            .Select(x => new { SkillId = x.Key, Count = x.Select(v => v.HoSoUngVienId).Distinct().Count() })
            .ToListAsync(cancellationToken);
        var parseStatuses = await db.KetQuaPhanTichCvs.AsNoTracking()
            .GroupBy(x => x.PhanTich)
            .Select(x => new { Status = x.Key, Count = x.Count() })
            .ToListAsync(cancellationToken);
        var importStatuses = await db.CVImportSessions.AsNoTracking()
            .GroupBy(x => x.TrangThai)
            .Select(x => new { Status = x.Key, Count = x.Count() })
            .ToListAsync(cancellationToken);
        var recommendations = await db.KetQuaPhuHops.AsNoTracking()
            .Select(x => new { x.DiemPhuHop, x.KyNangThieu, x.EvaluateAt })
            .ToListAsync(cancellationToken);

        var identityUsers = await identityDb.Users.AsNoTracking()
            .Select(x => new { x.LockoutEnd, x.AccessFailedCount, x.EmailConfirmed, x.TwoFactorEnabled })
            .ToListAsync(cancellationToken);

        var jobStatus = jobs.GroupBy(x => x.TrangThai)
            .Select(x => new NamedValueDto(JobStatusLabel(x.Key), x.Count()))
            .OrderByDescending(x => x.Value)
            .ToList();
        var applicationStatus = applications.GroupBy(x => x.TrangThai)
            .Select(x => new NamedValueDto(ApplicationStatusLabel(x.Key), x.Count()))
            .OrderByDescending(x => x.Value)
            .ToList();
        var userRoles = users.GroupBy(x => x.VaiTro)
            .Select(x => new NamedValueDto(RoleLabel(x.Key), x.Count()))
            .OrderByDescending(x => x.Value)
            .ToList();
        var cvMethods = cvs.Where(x => !x.IsDaXoa)
            .GroupBy(x => x.PhuongThucTao)
            .Select(x => new NamedValueDto(CvMethodLabel(x.Key), x.Count()))
            .OrderByDescending(x => x.Value)
            .ToList();

        var skillSupply = candidateSkills.ToDictionary(x => x.SkillId, x => x.Count);
        var skillDemand = jobSkills.GroupBy(x => new { x.KyNangId, x.TenKyNang })
            .Select(x => new SkillDemandDto(
                x.Key.TenKyNang,
                x.Count(),
                skillSupply.GetValueOrDefault(x.Key.KyNangId),
                Math.Max(0, x.Count() - skillSupply.GetValueOrDefault(x.Key.KyNangId))))
            .OrderByDescending(x => x.Demand)
            .ThenBy(x => x.Name)
            .Take(8)
            .ToList();

        var topCategories = jobs
            .Where(x => !string.IsNullOrWhiteSpace(x.Category))
            .GroupBy(x => x.Category)
            .Select(x => new NamedValueDto(x.Key, x.Count()))
            .OrderByDescending(x => x.Value)
            .Take(8)
            .ToList();
        var salaryByCategory = jobs
            .Where(x => !string.IsNullOrWhiteSpace(x.Category) && (x.LuongToiThieu > 0 || x.LuongToiDa > 0))
            .GroupBy(x => x.Category)
            .Select(x => new SalaryDto(
                x.Key,
                Math.Round(x.Average(v => v.LuongToiDa > 0
                    ? (v.LuongToiThieu + v.LuongToiDa) / 2
                    : v.LuongToiThieu), 1)))
            .OrderByDescending(x => x.Average)
            .Take(8)
            .ToList();
        var geography = candidateLocations
            .Select(NormalizeLocation)
            .Where(x => x.Length > 0)
            .GroupBy(x => x, StringComparer.OrdinalIgnoreCase)
            .Select(x => new NamedValueDto(x.Key, x.Count()))
            .OrderByDescending(x => x.Value)
            .Take(8)
            .ToList();

        var successfulParses = parseStatuses
            .Where(x => x.Status == TrangThaiPhanTichAgent.HoanThanh)
            .Sum(x => x.Count);
        var failedParses = parseStatuses
            .Where(x => x.Status == TrangThaiPhanTichAgent.ThatBai)
            .Sum(x => x.Count);
        var pendingParses = parseStatuses
            .Where(x => x.Status == TrangThaiPhanTichAgent.DangPhanTich)
            .Sum(x => x.Count);
        var failedImports = importStatuses
            .Where(x => x.Status == TrangThaiCvImport.Failed || x.Status == TrangThaiCvImport.Expired)
            .Sum(x => x.Count);

        var growth = BuildGrowthSeries(
            periodStart,
            now,
            days,
            users.Select(x => x.Created),
            jobs.Select(x => x.Created),
            applications.Select(x => x.Created),
            cvs.Where(x => !x.IsDaXoa).Select(x => x.Created));

        var activity = jobs.Select(x => new ActivityDto(x.Created, "Tin tuyển dụng", x.TieuDe, "job"))
            .Concat(companies.Select(x => new ActivityDto(x.Created, "Doanh nghiệp", x.TenDoanhNghiep, "company")))
            .Concat(cvs.Where(x => !x.IsDaXoa).Select(x => new ActivityDto(x.Created, "CV", x.TenFile, "cv")))
            .Concat(applications.Select(x => new ActivityDto(x.Created, "Ứng tuyển", x.JobTitle, "application")))
            .OrderByDescending(x => x.At)
            .Take(12)
            .ToList();

        var activeJobs = jobs.Count(x => x.TrangThai == TrangThaiTinTuyenDung.DangTuyen);
        var pendingJobs = jobs.Count(x => x.TrangThai is TrangThaiTinTuyenDung.ChoAdminDuyet
            or TrangThaiTinTuyenDung.ChoDuyetHeThong
            or TrangThaiTinTuyenDung.ChoNguoiDaiDienDuyet);
        var activeCvs = cvs.Count(x => !x.IsDaXoa);
        var aiCvs = cvs.Count(x => !x.IsDaXoa && x.PhuongThucTao == PhuongThucTaoCV.AIAgentHoTro);

        var healthReport = await healthChecks.CheckHealthAsync(
            _ => true,
            cancellationToken);
        var minioHealthy = healthReport.Entries.TryGetValue("object-storage", out var minioHealth)
            && minioHealth.Status == HealthStatus.Healthy;
        var redisHealthy = healthReport.Entries.TryGetValue("redis", out var redisHealth)
            && redisHealth.Status == HealthStatus.Healthy;
        var aiTracked = healthReport.Entries.TryGetValue("ai-provider", out var aiHealth);

        var result = new AdminDashboardDto(
            now,
            days,
            [
                Metric("Người dùng", users.Count, PeriodChange(users.Select(x => x.Created), periodStart, previousStart), "users"),
                Metric("Doanh nghiệp", companies.Count, PeriodChange(companies.Select(x => x.Created), periodStart, previousStart), "companies"),
                Metric("Tin tuyển dụng", jobs.Count, PeriodChange(jobs.Select(x => x.Created), periodStart, previousStart), "jobs"),
                Metric("Lượt ứng tuyển", applications.Count, PeriodChange(applications.Select(x => x.Created), periodStart, previousStart), "applications"),
                Metric("CV đang lưu", activeCvs, PeriodChange(cvs.Where(x => !x.IsDaXoa).Select(x => x.Created), periodStart, previousStart), "cvs"),
                Metric("CV có Adam hỗ trợ", aiCvs, PeriodChange(cvs.Where(x => !x.IsDaXoa && x.PhuongThucTao == PhuongThucTaoCV.AIAgentHoTro).Select(x => x.Created), periodStart, previousStart), "ai-cvs"),
                Metric("Tin đang tuyển", activeJobs, null, "active-jobs"),
                Metric("Chờ duyệt", pendingJobs, null, "pending-jobs")
            ],
            growth,
            jobStatus,
            applicationStatus,
            userRoles,
            geography,
            topCategories,
            skillDemand,
            salaryByCategory,
            cvMethods,
            new CvProcessingDto(successfulParses, failedParses + failedImports, pendingParses),
            new RecommendationDto(
                recommendations.Count,
                recommendations.Count == 0 ? null : Math.Round(recommendations.Average(x => x.DiemPhuHop) * 100, 1),
                recommendations.Count(x => x.DiemPhuHop >= 0.7f)),
            new ModerationDto(
                jobs.Count(x => x.TrangThai == TrangThaiTinTuyenDung.ChoAdminDuyet),
                jobs.Count(x => x.TrangThai == TrangThaiTinTuyenDung.ChoDuyetHeThong),
                jobs.Count(x => x.TrangThai == TrangThaiTinTuyenDung.ChoNguoiDaiDienDuyet),
                jobs.Count(x => x.TrangThai == TrangThaiTinTuyenDung.BiKhoa)),
            new SecurityDto(
                identityUsers.Count(x => x.LockoutEnd > DateTimeOffset.UtcNow),
                identityUsers.Count(x => x.AccessFailedCount > 0),
                identityUsers.Count(x => !x.EmailConfirmed),
                identityUsers.Count(x => x.TwoFactorEnabled)),
            [
                new HealthDto("API", "healthy", true),
                new HealthDto("PostgreSQL", "healthy", true),
                new HealthDto("Redis", redisHealthy && redis.IsConnected ? "healthy" : "degraded", true),
                new HealthDto("RabbitMQ", "not-tracked", false),
                new HealthDto("Object Storage", minioHealthy ? "healthy" : "degraded", true),
                new HealthDto("AI Provider", aiTracked && aiHealth.Status == HealthStatus.Healthy ? "healthy" : "degraded", aiTracked)
            ],
            activity,
            [
                "Hệ thống chưa lưu telemetry hội thoại Adam, token, chi phí hoặc lỗi AI.",
                "Chưa có sự kiện click/view để tính CTR và conversion của recommendation.",
                "Chưa có audit log bất biến hoặc lịch sử đăng nhập; số liệu bảo mật là trạng thái hiện tại.",
                "Địa điểm ứng viên được nhóm từ trường địa chỉ tự do, chưa có mã tỉnh/thành chuẩn hóa."
            ]);

        try
        {
            await cache.SetStringAsync(
                cacheKey,
                JsonSerializer.Serialize(result),
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30) },
                cancellationToken);
        }
        catch (RedisException)
        {
            // PostgreSQL remains the source of truth; cache failures are non-fatal.
        }

        return Ok(new Response<AdminDashboardDto>(result));
    }

    private static MetricDto Metric(string label, int value, double? change, string key) =>
        new(key, label, value, change);

    private static double? PeriodChange(IEnumerable<DateTime> dates, DateTime start, DateTime previousStart)
    {
        var values = dates.ToList();
        var current = values.Count(x => x >= start);
        var previous = values.Count(x => x >= previousStart && x < start);
        if (previous == 0) return current == 0 ? 0 : null;
        return Math.Round((current - previous) * 100d / previous, 1);
    }

    private static List<GrowthPointDto> BuildGrowthSeries(
        DateTime start,
        DateTime now,
        int days,
        IEnumerable<DateTime> users,
        IEnumerable<DateTime> jobs,
        IEnumerable<DateTime> applications,
        IEnumerable<DateTime> cvs)
    {
        var userDates = users.ToList();
        var jobDates = jobs.ToList();
        var applicationDates = applications.ToList();
        var cvDates = cvs.ToList();
        var bucketDays = days <= 30 ? 1 : days <= 90 ? 7 : 30;
        var result = new List<GrowthPointDto>();

        for (var bucketStart = start; bucketStart <= now; bucketStart = bucketStart.AddDays(bucketDays))
        {
            var bucketEnd = bucketStart.AddDays(bucketDays);
            result.Add(new GrowthPointDto(
                bucketStart,
                userDates.Count(x => x >= bucketStart && x < bucketEnd),
                jobDates.Count(x => x >= bucketStart && x < bucketEnd),
                applicationDates.Count(x => x >= bucketStart && x < bucketEnd),
                cvDates.Count(x => x >= bucketStart && x < bucketEnd)));
        }

        return result;
    }

    private static string NormalizeLocation(string location)
    {
        var value = location.Trim();
        if (value.Length == 0) return string.Empty;
        var parts = value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return parts.Length == 0 ? value : parts[^1];
    }

    private static string RoleLabel(VaiTroNguoiDung role) => role switch
    {
        VaiTroNguoiDung.QUAN_TRI_VIEN => "Quản trị viên",
        VaiTroNguoiDung.NGUOI_DAI_DIEN => "Người đại diện",
        VaiTroNguoiDung.NHAN_SU => "Nhân sự",
        VaiTroNguoiDung.UNG_VIEN => "Ứng viên",
        _ => role.ToString()
    };

    private static string CvMethodLabel(PhuongThucTaoCV method) => method switch
    {
        PhuongThucTaoCV.ThuCongTemplate => "Thủ công",
        PhuongThucTaoCV.TaiLenTrucTiep => "Import",
        PhuongThucTaoCV.AIAgentHoTro => "Adam AI",
        _ => method.ToString()
    };

    private static string JobStatusLabel(TrangThaiTinTuyenDung status) => status switch
    {
        TrangThaiTinTuyenDung.Nhap => "Nháp",
        TrangThaiTinTuyenDung.ChoDuyetHeThong => "Hệ thống đang duyệt",
        TrangThaiTinTuyenDung.ChoAdminDuyet => "Chờ admin duyệt",
        TrangThaiTinTuyenDung.DangTuyen => "Đang tuyển",
        TrangThaiTinTuyenDung.TamDung => "Tạm dừng",
        TrangThaiTinTuyenDung.HetHan => "Hết hạn",
        TrangThaiTinTuyenDung.DaDong => "Đã đóng",
        TrangThaiTinTuyenDung.TuChoi => "Từ chối",
        TrangThaiTinTuyenDung.BiKhoa => "Bị khóa",
        TrangThaiTinTuyenDung.ChoNguoiDaiDienDuyet => "Chờ người đại diện",
        _ => status.ToString()
    };

    private static string ApplicationStatusLabel(TrangThaiDonUngTuyen status) => status switch
    {
        TrangThaiDonUngTuyen.KhoiTao => "Khởi tạo",
        TrangThaiDonUngTuyen.LoiXuLyHoSo => "Lỗi xử lý",
        TrangThaiDonUngTuyen.ChoXuLy => "Chờ xử lý",
        TrangThaiDonUngTuyen.DaXem => "Đã xem",
        TrangThaiDonUngTuyen.UngVienRutDon => "Ứng viên rút đơn",
        TrangThaiDonUngTuyen.PhuHop => "Phù hợp",
        TrangThaiDonUngTuyen.TuChoi => "Từ chối",
        TrangThaiDonUngTuyen.QuaHanXuLy => "Quá hạn",
        TrangThaiDonUngTuyen.TinTuyenDungBiDong => "Tin đã đóng",
        TrangThaiDonUngTuyen.VoHieuHoa => "Vô hiệu hóa",
        _ => status.ToString()
    };
}

public sealed record AdminDashboardDto(
    DateTime GeneratedAtUtc,
    int PeriodDays,
    IReadOnlyList<MetricDto> Summary,
    IReadOnlyList<GrowthPointDto> Growth,
    IReadOnlyList<NamedValueDto> JobStatus,
    IReadOnlyList<NamedValueDto> ApplicationStatus,
    IReadOnlyList<NamedValueDto> UserRoles,
    IReadOnlyList<NamedValueDto> Geography,
    IReadOnlyList<NamedValueDto> TopCategories,
    IReadOnlyList<SkillDemandDto> SkillDemand,
    IReadOnlyList<SalaryDto> SalaryByCategory,
    IReadOnlyList<NamedValueDto> CvMethods,
    CvProcessingDto CvProcessing,
    RecommendationDto Recommendation,
    ModerationDto Moderation,
    SecurityDto Security,
    IReadOnlyList<HealthDto> Health,
    IReadOnlyList<ActivityDto> RecentActivity,
    IReadOnlyList<string> DataLimitations);

public sealed record MetricDto(string Key, string Label, int Value, double? ChangePercent);
public sealed record GrowthPointDto(DateTime Date, int Users, int Jobs, int Applications, int Cvs);
public sealed record NamedValueDto(string Name, int Value);
public sealed record SkillDemandDto(string Name, int Demand, int Supply, int Gap);
public sealed record SalaryDto(string Name, decimal Average);
public sealed record CvProcessingDto(int Successful, int Failed, int Pending);
public sealed record RecommendationDto(int Total, double? AverageMatchPercent, int HighMatchCount);
public sealed record ModerationDto(int AdminPending, int SystemPending, int RepresentativePending, int LockedJobs);
public sealed record SecurityDto(int LockedAccounts, int AccountsWithFailedAccess, int UnconfirmedEmails, int TwoFactorEnabled);
public sealed record HealthDto(string Name, string Status, bool IsTracked);
public sealed record ActivityDto(DateTime At, string Type, string Description, string Entity);
