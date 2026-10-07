using Application.Features.DanhGia.Queries.GetAllDanhGias;
using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.DanhGia.Queries.GetDanhGiaById;
public class GetDanhGiaByIdQuery : IRequest<Response<GetAllDanhGiasViewModel>>
{
    public int Id { get; set; }
}

public class GetDanhGiaByIdQueryHandler(
    IApplicationDbContext context,
    IMapper mapper, ICurrentNguoiDungService current)
    : IRequestHandler<GetDanhGiaByIdQuery, Response<GetAllDanhGiasViewModel>>
{
    public async Task<Response<GetAllDanhGiasViewModel>> Handle(
        GetDanhGiaByIdQuery request,
        CancellationToken cancellationToken)
    {
        var entity = await Application.Security.ResourceAccess.ScopeReviews(context.DanhGias.AsNoTracking(), await current.ResolveAsync())
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (entity == null)
        {
            return new Response<GetAllDanhGiasViewModel>(
                "Không tìm thấy đánh giá.");
        }

        return new Response<GetAllDanhGiasViewModel>(
            mapper.Map<GetAllDanhGiasViewModel>(entity));
    }
}
