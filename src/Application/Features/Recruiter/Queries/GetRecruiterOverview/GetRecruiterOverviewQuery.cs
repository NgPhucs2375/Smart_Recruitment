using Application.DTOs.Recruiter;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Recruiter.Queries.GetRecruiterOverview;

public sealed class GetRecruiterOverviewQuery : IRequest<Response<RecruitmentOverview>>;

public sealed class GetRecruiterOverviewQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<GetRecruiterOverviewQuery, Response<RecruitmentOverview>>
{
    public async Task<Response<RecruitmentOverview>> Handle(
        GetRecruiterOverviewQuery request,
        CancellationToken cancellationToken)
    {
        var (scope, error) = await RecruiterQueryAccess.ResolveAsync(current, representativeOnly: true);
        if (scope is null) return new Response<RecruitmentOverview>(error!);

        var jobs = context.TinTuyenDungs.AsNoTracking()
            .Where(x => x.DoanhNghiepId == scope.CompanyId);
        var applications = context.DonUngTuyens.AsNoTracking()
            .Where(x => x.DoanhNghiepId == scope.CompanyId);

        return new Response<RecruitmentOverview>(new RecruitmentOverview
        {
            TongTin = await jobs.CountAsync(cancellationToken),
            TinDangTuyen = await jobs.CountAsync(
                x => x.TrangThai == TrangThaiTinTuyenDung.DangTuyen,
                cancellationToken),
            TongDon = await applications.CountAsync(cancellationToken),
            DonChoXuLy = await applications.CountAsync(
                x => x.TrangThai == TrangThaiDonUngTuyen.ChoXuLy,
                cancellationToken)
        });
    }
}
