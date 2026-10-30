using Application.DTOs.Recruiter;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Recruiter.Queries.GetRecruiterApplicationPipeline;

public sealed class GetRecruiterApplicationPipelineQuery : IRequest<Response<List<ApplicationPipelineStage>>>
{
    public int? TinTuyenDungId { get; init; }
}

public sealed class GetRecruiterApplicationPipelineQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<GetRecruiterApplicationPipelineQuery, Response<List<ApplicationPipelineStage>>>
{
    public async Task<Response<List<ApplicationPipelineStage>>> Handle(
        GetRecruiterApplicationPipelineQuery request,
        CancellationToken cancellationToken)
    {
        var (scope, error) = await RecruiterQueryAccess.ResolveAsync(current, representativeOnly: false);
        if (scope is null) return new Response<List<ApplicationPipelineStage>>(error!);

        var query = context.DonUngTuyens.AsNoTracking()
            .Where(d => d.DoanhNghiepId == scope.CompanyId);

        if (scope.Actor.VaiTro == VaiTroNguoiDung.NHAN_SU)
            query = query.Where(d => d.TinTuyenDung.NguoiDangTinId == scope.Actor.Id);

        if (request.TinTuyenDungId.HasValue)
            query = query.Where(d => d.TinTuyenDungId == request.TinTuyenDungId.Value);

        var stages = await query
            .GroupBy(d => d.TrangThai)
            .Select(g => new ApplicationPipelineStage
            {
                TrangThai = g.Key.ToString(),
                SoLuong = g.Count()
            })
            .OrderByDescending(x => x.SoLuong)
            .ToListAsync(cancellationToken);

        return new Response<List<ApplicationPipelineStage>>(stages);
    }
}
