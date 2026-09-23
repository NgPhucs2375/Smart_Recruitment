using Application.Features.HoSoNhaTuyenDung.Queries.GetAllHoSoNhaTuyenDungs;
using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.HoSoNhaTuyenDung.Queries.GetMyHoSoNhaTuyenDung;

/// <summary>
/// Hồ sơ nhà tuyển dụng của chính user đang đăng nhập (Nhân sự / Người đại diện).
/// </summary>
public class GetMyHoSoNhaTuyenDungQuery : IRequest<Response<GetAllHoSoNhaTuyenDungsViewModel>>
{
}

public class GetMyHoSoNhaTuyenDungQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<GetMyHoSoNhaTuyenDungQuery, Response<GetAllHoSoNhaTuyenDungsViewModel>>
{
    public async Task<Response<GetAllHoSoNhaTuyenDungsViewModel>> Handle(
        GetMyHoSoNhaTuyenDungQuery request,
        CancellationToken cancellationToken)
    {
        var ctx = await current.ResolveAsync();

        var query = context.HoSoNhaTuyenDungs
            .AsNoTracking()
            .Where(x => x.NguoiDungId == ctx.Id);

        // Ưu tiên hồ sơ thuộc doanh nghiệp user đang làm việc.
        var entity = ctx.DoanhNghiepId.HasValue
            ? await query
                .OrderByDescending(x => x.DoanhNghiepId == ctx.DoanhNghiepId.Value)
                .ThenBy(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken)
            : await query
                .OrderBy(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);

        if (entity == null)
        {
            return new Response<GetAllHoSoNhaTuyenDungsViewModel>(
                "Bạn chưa có hồ sơ nhà tuyển dụng.");
        }

        return new Response<GetAllHoSoNhaTuyenDungsViewModel>(
            new GetAllHoSoNhaTuyenDungsViewModel
            {
                Id = entity.Id,
                NguoiDungId = entity.NguoiDungId,
                DoanhNghiepId = entity.DoanhNghiepId,
                HoTen = entity.HoTen,
                SDT = entity.SDT,
                ChucVu = entity.ChucVu
            });
    }
}
