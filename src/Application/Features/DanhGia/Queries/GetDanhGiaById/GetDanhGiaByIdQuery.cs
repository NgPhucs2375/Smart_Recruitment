using Application.Features.DanhGia.Queries.GetAllDanhGias;
using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;

namespace Application.Features.DanhGia.Queries.GetDanhGiaById;
public class GetDanhGiaByIdQuery : IRequest<Response<GetAllDanhGiasViewModel>>
{
    public int Id { get; set; }
}

public class GetDanhGiaByIdQueryHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<GetDanhGiaByIdQuery, Response<GetAllDanhGiasViewModel>>
{
    public async Task<Response<GetAllDanhGiasViewModel>> Handle(
        GetDanhGiaByIdQuery request,
        CancellationToken cancellationToken)
    {
        var entity = await context.DanhGias
            .FindAsync([request.Id], cancellationToken);

        if (entity == null)
        {
            return new Response<GetAllDanhGiasViewModel>(
                "Không tìm thấy đánh giá.");
        }

        return new Response<GetAllDanhGiasViewModel>(
            mapper.Map<GetAllDanhGiasViewModel>(entity));
    }
}
