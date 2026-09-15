using Application.DTOs.CV;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CVUngVien.Queries.GetCVUngVienById;

public class GetCVUngVienByIdQuery
    : IRequest<Response<CvDetailDto>>
{
    public int Id { get; set; }
}

public class GetCVUngVienByIdQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService currentNguoiDungService,
    ICvReadMapper cvReadMapper)
    : IRequestHandler<
        GetCVUngVienByIdQuery,
        Response<CvDetailDto>>
{
    public async Task<Response<CvDetailDto>> Handle(
        GetCVUngVienByIdQuery request,
        CancellationToken cancellationToken)
    {
        var currentUser =
            await currentNguoiDungService.ResolveAsync();

        var entity = await context.CVUngViens
            .AsNoTracking()

            .Include(x => x.ThongTinLienHe)

            .Include(x => x.HocVans)

            .Include(x => x.KinhNghiems)
                .ThenInclude(x => x.KyNangs)

            .Include(x => x.DuAns)
                .ThenInclude(x => x.CongNghes)

            .Include(x => x.KyNangs)

            .Include(x => x.ChungChis)

            .FirstOrDefaultAsync(
                x =>
                    x.Id == request.Id &&
                    !x.IsDaXoa &&
                    x.HoSoUngVien.NguoiDungId ==
                        currentUser.Id,
                cancellationToken);

        if (entity == null)
        {
            return new Response<CvDetailDto>(
                "Không tìm thấy CV.");
        }

        var result =
            cvReadMapper.Map(entity);

        return new Response<CvDetailDto>(
            data: result,
            message: "Lấy CV thành công.");
    }
}