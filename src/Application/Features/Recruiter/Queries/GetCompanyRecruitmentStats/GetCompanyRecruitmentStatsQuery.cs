using Application.DTOs.Recruiter;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Recruiter.Queries.GetCompanyRecruitmentStats;

public sealed class GetCompanyRecruitmentStatsQuery : IRequest<Response<CompanyRecruitmentStats>>;

public sealed class GetCompanyRecruitmentStatsQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<GetCompanyRecruitmentStatsQuery, Response<CompanyRecruitmentStats>>
{
    public async Task<Response<CompanyRecruitmentStats>> Handle(
        GetCompanyRecruitmentStatsQuery request,
        CancellationToken cancellationToken)
    {
        var (scope, error) = await RecruiterQueryAccess.ResolveAsync(current, representativeOnly: true);
        if (scope is null) return new Response<CompanyRecruitmentStats>(error!);

        var since = DateTime.UtcNow.AddDays(-30);
        var jobs = context.TinTuyenDungs.AsNoTracking()
            .Where(x => x.DoanhNghiepId == scope.CompanyId);
        var applications = context.DonUngTuyens.AsNoTracking()
            .Where(x => x.DoanhNghiepId == scope.CompanyId);
        var matches = context.KetQuaPhuHops.AsNoTracking()
            .Where(x => x.TinTuyenDung.DoanhNghiepId == scope.CompanyId && x.EvaluateAt >= since);

        var diemGoiY = await matches.Select(x => x.DiemPhuHop).ToListAsync(cancellationToken);

        return new Response<CompanyRecruitmentStats>(new CompanyRecruitmentStats
        {
            TinTao30Ngay = await jobs.CountAsync(x => x.Created >= since, cancellationToken),
            DonNhan30Ngay = await applications.CountAsync(
                x => (x.NgayUngTuyen ?? x.Created) >= since,
                cancellationToken),
            DonPhuHop = await applications.CountAsync(
                x => x.TrangThai == TrangThaiDonUngTuyen.PhuHop,
                cancellationToken),
            DonTuChoi = await applications.CountAsync(
                x => x.TrangThai == TrangThaiDonUngTuyen.TuChoi,
                cancellationToken),
            TongKetQuaGoiY = diemGoiY.Count,
            DiemPhuHopTb = diemGoiY.Count == 0
                ? null
                : Math.Round(diemGoiY.Average(x => (double)x) * 100, 1),
            TyLePhuHopCao = diemGoiY.Count == 0
                ? null
                : Math.Round(diemGoiY.Count(x => x >= 0.7f) * 100d / diemGoiY.Count, 1)
        });
    }
}
