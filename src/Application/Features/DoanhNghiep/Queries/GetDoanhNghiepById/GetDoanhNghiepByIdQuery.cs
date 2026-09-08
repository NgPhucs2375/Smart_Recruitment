using Application.Features.DoanhNghiep.Queries.GetAllDoanhNghieps;
using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;

namespace Application.Features.DoanhNghiep.Queries.GetDoanhNghiepById;
public class GetDoanhNghiepByIdQuery : IRequest<Response<GetAllDoanhNghiepsViewModel>> { public int Id { get; set; } }
public class GetDoanhNghiepByIdQueryHandler(IApplicationDbContext context, IMapper mapper) : IRequestHandler<GetDoanhNghiepByIdQuery, Response<GetAllDoanhNghiepsViewModel>>
{
    public async Task<Response<GetAllDoanhNghiepsViewModel>> Handle(GetDoanhNghiepByIdQuery request, CancellationToken cancellationToken)
    { var entity = await context.DoanhNghieps.FindAsync([request.Id], cancellationToken); if (entity == null) return new Response<GetAllDoanhNghiepsViewModel>("Không tìm thấy doanh nghiệp."); return new Response<GetAllDoanhNghiepsViewModel>(mapper.Map<GetAllDoanhNghiepsViewModel>(entity)); }
}
