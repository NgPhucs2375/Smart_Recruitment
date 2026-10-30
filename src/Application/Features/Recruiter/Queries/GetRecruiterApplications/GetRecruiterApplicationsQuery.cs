using Application.DTOs.Recruiter;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Recruiter.Queries.GetRecruiterApplications;

public sealed class GetRecruiterApplicationsQuery : IRequest<Response<List<RecruitmentApplication>>>
{
    public int? DonUngTuyenId { get; init; }
    public int? TinTuyenDungId { get; init; }
    public int? CVUngVienId { get; init; }
    public int? HoSoUngVienId { get; init; }
    public TrangThaiDonUngTuyen? TrangThai { get; init; }
    public DateTime? Before { get; init; }
    public bool OldestFirst { get; init; }
    public int TopN { get; init; } = 20;
}

public sealed class GetRecruiterApplicationsQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<GetRecruiterApplicationsQuery, Response<List<RecruitmentApplication>>>
{
    public async Task<Response<List<RecruitmentApplication>>> Handle(
        GetRecruiterApplicationsQuery request,
        CancellationToken cancellationToken)
    {
        var (scope, error) = await RecruiterQueryAccess.ResolveAsync(current, representativeOnly: false);
        if (scope is null) return new Response<List<RecruitmentApplication>>(error!);

        var query = context.DonUngTuyens.AsNoTracking()
            .Where(d => d.DoanhNghiepId == scope.CompanyId);

        if (scope.Actor.VaiTro == VaiTroNguoiDung.NHAN_SU)
            query = query.Where(d => d.TinTuyenDung.NguoiDangTinId == scope.Actor.Id);

        if (request.DonUngTuyenId.HasValue)
            query = query.Where(d => d.Id == request.DonUngTuyenId.Value);

        if (request.TinTuyenDungId.HasValue)
            query = query.Where(d => d.TinTuyenDungId == request.TinTuyenDungId.Value);

        if (request.CVUngVienId.HasValue)
            query = query.Where(d => d.CVUngVienId == request.CVUngVienId.Value);

        if (request.HoSoUngVienId.HasValue)
            query = query.Where(d => d.CVUngVien.HoSoUngVienId == request.HoSoUngVienId.Value);

        if (request.TrangThai.HasValue)
            query = query.Where(d => d.TrangThai == request.TrangThai.Value);

        if (request.Before.HasValue)
            query = query.Where(d => (d.NgayUngTuyen ?? d.Created) <= request.Before.Value);

        var ordered = request.OldestFirst
            ? query.OrderBy(d => d.NgayUngTuyen ?? d.Created)
            : query.OrderByDescending(d => d.NgayUngTuyen ?? d.Created);

        var items = await ordered
            .Take(Math.Clamp(request.TopN, 1, 50))
            .Select(d => new RecruitmentApplication
            {
                DonUngTuyenId = d.Id,
                TinTuyenDungId = d.TinTuyenDungId,
                TieuDeTin = d.TinTuyenDung.TieuDe,
                CVUngVienId = d.CVUngVienId,
                HoSoUngVienId = d.CVUngVien.HoSoUngVienId,
                HoTenUngVien = d.CVUngVien.HoSoUngVien.HoTen,
                TrangThai = d.TrangThai.ToString(),
                GhiChu = d.GhiChu,
                NgayUngTuyen = d.NgayUngTuyen,
                NguoiXuLyId = d.NguoiXuLyId
            })
            .ToListAsync(cancellationToken);

        return new Response<List<RecruitmentApplication>>(items);
    }
}
