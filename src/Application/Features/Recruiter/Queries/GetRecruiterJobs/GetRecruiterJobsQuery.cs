using Application.DTOs.Recruiter;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Recruiter.Queries.GetRecruiterJobs;

public enum RecruiterJobListMode
{
    Manageable = 0,
    ActiveWithSkills = 1
}

public sealed class GetRecruiterJobsQuery : IRequest<Response<List<RecruitmentJobOption>>>
{
    public RecruiterJobListMode Mode { get; init; } = RecruiterJobListMode.Manageable;
    public int Take { get; init; } = 50;
}

public sealed class GetRecruiterJobsQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<GetRecruiterJobsQuery, Response<List<RecruitmentJobOption>>>
{
    public async Task<Response<List<RecruitmentJobOption>>> Handle(
        GetRecruiterJobsQuery request,
        CancellationToken cancellationToken)
    {
        var (scope, error) = await RecruiterQueryAccess.ResolveAsync(current, representativeOnly: false);
        if (scope is null) return new Response<List<RecruitmentJobOption>>(error!);

        var now = DateTime.UtcNow;
        var query = context.TinTuyenDungs.AsNoTracking()
            .Where(x => x.DoanhNghiepId == scope.CompanyId);

        if (request.Mode == RecruiterJobListMode.ActiveWithSkills)
        {
            query = query.Where(x =>
                x.TrangThai == TrangThaiTinTuyenDung.DangTuyen &&
                (x.NgayHetHan == null || x.NgayHetHan > now));
        }
        else
        {
            query = query.Where(x =>
                x.TrangThai != TrangThaiTinTuyenDung.DaDong &&
                x.TrangThai != TrangThaiTinTuyenDung.HetHan);
        }

        if (scope.Actor.VaiTro == VaiTroNguoiDung.NHAN_SU)
            query = query.Where(x => x.NguoiDangTinId == scope.Actor.Id);

        var take = Math.Clamp(request.Take, 1, 50);

        List<RecruitmentJobOption> jobs;
        if (request.Mode == RecruiterJobListMode.ActiveWithSkills)
        {
            jobs = await query
                .OrderByDescending(x => x.Created)
                .Take(take)
                .Select(x => new RecruitmentJobOption
                {
                    TinTuyenDungId = x.Id,
                    TieuDe = x.TieuDe,
                    TrangThai = x.TrangThai.ToString(),
                    DiaDiemLamViec = x.DiaDiemLamViec,
                    LuongToiThieu = x.LuongToiThieu,
                    LuongToiDa = x.LuongToiDa,
                    KyNang = x.KyNangTinTuyenDungs
                        .Where(k => k.KyNang != null)
                        .Select(k => k.KyNang!.TenKyNang)
                        .ToList()
                })
                .ToListAsync(cancellationToken);
        }
        else
        {
            jobs = await query
                .OrderByDescending(x => x.Created)
                .Take(take)
                .Select(x => new RecruitmentJobOption
                {
                    TinTuyenDungId = x.Id,
                    TieuDe = x.TieuDe,
                    TrangThai = x.TrangThai.ToString(),
                    DiaDiemLamViec = x.DiaDiemLamViec,
                    LuongToiThieu = x.LuongToiThieu,
                    LuongToiDa = x.LuongToiDa
                })
                .ToListAsync(cancellationToken);
        }

        return new Response<List<RecruitmentJobOption>>(jobs);
    }
}
