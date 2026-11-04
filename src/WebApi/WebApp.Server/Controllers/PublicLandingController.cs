using Application.Interfaces;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace WebApp.Server.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/public/landing")]
public sealed class PublicLandingController(IApplicationDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var jobsQuery = context.TinTuyenDungs
            .AsNoTracking()
            .Where(job => job.TrangThai == TrangThaiTinTuyenDung.DangTuyen
                && (job.NgayHetHan == null || job.NgayHetHan > now));

        var totalJobs = await jobsQuery.CountAsync(cancellationToken);
        var totalCompanies = await jobsQuery.Select(job => job.DoanhNghiepId).Distinct().CountAsync(cancellationToken);
        var jobs = await jobsQuery
            .OrderByDescending(job => job.Created)
            .ThenByDescending(job => job.Id)
            .Take(6)
            .Select(job => new
            {
                id = job.Id,
                title = job.TieuDe,
                company = job.DoanhNghiep.TenDoanhNghiep,
                industry = job.DoanhNghiep.LinhVucHoatDong,
                salaryMin = job.LuongToiThieu,
                salaryMax = job.LuongToiDa,
                location = job.DiaDiemLamViec,
                workMode = job.PhuongThucLamViec.ToString(),
                level = InferLevel(job.TieuDe, job.KinhNghiemYeuCau),
                skills = job.KyNangTinTuyenDungs
                    .Select(skill => skill.DanhMucKyNang.TenKyNang)
                    .Take(5)
                    .ToList(),
                created = job.Created,
                applicants = job.DonUngTuyens.Count,
            })
            .ToListAsync(cancellationToken);

        var companies = jobs
            .GroupBy(job => new { job.company, job.industry })
            .Select(group => new
            {
                name = group.Key.company,
                industry = string.IsNullOrWhiteSpace(group.Key.industry) ? "Doanh nghiệp đang tuyển" : group.Key.industry,
                openings = group.Count(),
                latestJobCreated = group.Max(job => job.created),
            })
            .OrderByDescending(company => company.latestJobCreated)
            .Take(4)
            .ToList();

        return Ok(new
        {
            jobs,
            companies,
            stats = new
            {
                totalJobs,
                totalCompanies,
            },
        });
    }

    private static string InferLevel(string title, string? experience)
    {
        var text = $"{title} {experience}".ToLowerInvariant();
        if (text.Contains("intern") || text.Contains("thực tập")) return "Intern";
        if (text.Contains("fresher") || text.Contains("mới tốt nghiệp")) return "Fresher";
        if (text.Contains("junior")) return "Junior";
        if (text.Contains("lead") || text.Contains("trưởng nhóm")) return "Lead";
        if (text.Contains("manager") || text.Contains("quản lý")) return "Manager";
        if (text.Contains("senior") || text.Contains("cao cấp")) return "Senior";
        return "Mid";
    }
}
