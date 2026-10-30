using Application.DTOs.Recruiter;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.Recruiter.Queries.GetCompanyMembers;

public sealed class GetCompanyMembersQuery : IRequest<Response<List<CompanyMember>>>;

public sealed class GetCompanyMembersQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<GetCompanyMembersQuery, Response<List<CompanyMember>>>
{
    public async Task<Response<List<CompanyMember>>> Handle(
        GetCompanyMembersQuery request,
        CancellationToken cancellationToken)
    {
        var (scope, error) = await RecruiterQueryAccess.ResolveAsync(current, representativeOnly: true);
        if (scope is null) return new Response<List<CompanyMember>>(error!);

        var members = await context.HoSoNhaTuyenDungs.AsNoTracking()
            .Where(x =>
                x.DoanhNghiepId == scope.CompanyId &&
                x.NguoiDung.IsActive &&
                (x.NguoiDung.VaiTro == VaiTroNguoiDung.NHAN_SU ||
                 x.NguoiDung.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN))
            .Select(x => new CompanyMember
            {
                NguoiDungId = x.NguoiDungId,
                HoTen = x.HoTen,
                ChucVu = x.ChucVu,
                VaiTro = x.NguoiDung.VaiTro.ToString()
            })
            .ToListAsync(cancellationToken);

        return new Response<List<CompanyMember>>(members);
    }
}
