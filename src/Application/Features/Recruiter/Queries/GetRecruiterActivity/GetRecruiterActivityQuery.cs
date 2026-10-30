using Application.DTOs.Recruiter;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Recruiter.Queries.GetRecruiterActivity;

public sealed class GetRecruiterActivityQuery : IRequest<Response<RecruiterActivity>>
{
    public int NguoiDungId { get; init; }
}

public sealed class GetRecruiterActivityQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<GetRecruiterActivityQuery, Response<RecruiterActivity>>
{
    public async Task<Response<RecruiterActivity>> Handle(
        GetRecruiterActivityQuery request,
        CancellationToken cancellationToken)
    {
        var (scope, error) = await RecruiterQueryAccess.ResolveAsync(current, representativeOnly: true);
        if (scope is null) return new Response<RecruiterActivity>(error!);

        var member = await context.HoSoNhaTuyenDungs.AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.DoanhNghiepId == scope.CompanyId && x.NguoiDungId == request.NguoiDungId,
                cancellationToken);
        if (member is null)
            return new Response<RecruiterActivity>("Không tìm thấy nhân sự thuộc doanh nghiệp.");

        var jobs = context.TinTuyenDungs.AsNoTracking()
            .Where(x =>
                x.DoanhNghiepId == scope.CompanyId &&
                x.NguoiDangTinId == request.NguoiDungId);
        var handled = context.DonUngTuyens.AsNoTracking()
            .Where(x =>
                x.DoanhNghiepId == scope.CompanyId &&
                x.NguoiXuLyId == request.NguoiDungId);

        return new Response<RecruiterActivity>(new RecruiterActivity
        {
            NguoiDungId = request.NguoiDungId,
            HoTen = member.HoTen,
            TinDaDang = await jobs.CountAsync(cancellationToken),
            DonDaXuLy = await handled.CountAsync(cancellationToken),
            DonDanhGiaPhuHop = await handled.CountAsync(
                x => x.TrangThai == TrangThaiDonUngTuyen.PhuHop,
                cancellationToken),
            DonTuChoi = await handled.CountAsync(
                x => x.TrangThai == TrangThaiDonUngTuyen.TuChoi,
                cancellationToken)
        });
    }
}
