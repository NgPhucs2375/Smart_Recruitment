using Application.Features.DanhMucNghe.Queries.GetAllDanhMucNghes;
using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
namespace Application.Features.DanhMucNghe.Queries.GetDanhMucNgheById;
public class GetDanhMucNgheByIdQuery : IRequest<Response<GetAllDanhMucNghesViewModel>>
{
    public int Id { get; set; }
}

public class GetDanhMucNgheByIdQueryHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<GetDanhMucNgheByIdQuery, Response<GetAllDanhMucNghesViewModel>>
{
    public async Task<Response<GetAllDanhMucNghesViewModel>> Handle(
        GetDanhMucNgheByIdQuery request,
        CancellationToken cancellationToken)
    {
        var entity = await context.DanhMucNghes
            .FindAsync([request.Id], cancellationToken);

        if (entity == null)
        {
            return new Response<GetAllDanhMucNghesViewModel>(
                "Không tìm thấy danh mục nghề.");
        }

        return new Response<GetAllDanhMucNghesViewModel>(
            mapper.Map<GetAllDanhMucNghesViewModel>(entity));
    }
}
