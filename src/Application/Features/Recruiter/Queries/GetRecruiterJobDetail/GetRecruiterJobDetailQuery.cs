using Application.DTOs.Recruiter;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Recruiter.Queries.GetRecruiterJobDetail;

public sealed class GetRecruiterJobDetailQuery : IRequest<Response<RecruitmentJobDetail>>
{
    public int TinTuyenDungId { get; init; }
}

public sealed class GetRecruiterJobDetailQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<GetRecruiterJobDetailQuery, Response<RecruitmentJobDetail>>
{
    public async Task<Response<RecruitmentJobDetail>> Handle(
        GetRecruiterJobDetailQuery request,
        CancellationToken cancellationToken)
    {
        var (scope, error) = await RecruiterQueryAccess.ResolveAsync(current, representativeOnly: false);
        if (scope is null) return new Response<RecruitmentJobDetail>(error!);

        var query = context.TinTuyenDungs.AsNoTracking()
            .Where(x =>
                x.Id == request.TinTuyenDungId &&
                x.DoanhNghiepId == scope.CompanyId);

        if (scope.Actor.VaiTro == VaiTroNguoiDung.NHAN_SU)
            query = query.Where(x => x.NguoiDangTinId == scope.Actor.Id);

        var job = await query
            .Select(x => new RecruitmentJobDetail
            {
                TinTuyenDungId = x.Id,
                TieuDe = x.TieuDe,
                MoTaCongViec = x.MoTaCongViec,
                KinhNghiemYeuCau = x.KinhNghiemYeuCau,
                YeuCauCongViec = x.YeuCauCongViec,
                QuyenLoi = x.QuyenLoi,
                DiaDiemLamViec = x.DiaDiemLamViec,
                LuongToiThieu = x.LuongToiThieu,
                LuongToiDa = x.LuongToiDa,
                TrangThai = x.TrangThai.ToString(),
                NgayHetHan = x.NgayHetHan,
                KyNang = x.KyNangTinTuyenDungs
                    .Where(k => k.KyNang != null)
                    .Select(k => k.KyNang!.TenKyNang)
                    .ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

        return job == null
            ? new Response<RecruitmentJobDetail>("Không tìm thấy tin tuyển dụng thuộc doanh nghiệp của bạn.")
            : new Response<RecruitmentJobDetail>(job);
    }
}
