using Application.Features.CVUngVien.Queries.GetAllCVUngViens;
using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;

namespace Application.Features.CVUngVien.Queries.GetCVUngVienById;
public class GetCVUngVienByIdQuery : IRequest<Response<GetAllCVUngViensViewModel>> { public int Id { get; set; } }
public class GetCVUngVienByIdQueryHandler(IApplicationDbContext context, IMapper mapper) : IRequestHandler<GetCVUngVienByIdQuery, Response<GetAllCVUngViensViewModel>>
{
    public async Task<Response<GetAllCVUngViensViewModel>> Handle(GetCVUngVienByIdQuery request, CancellationToken cancellationToken)
    { var entity = await context.CVUngViens.FindAsync([request.Id], cancellationToken); if (entity == null) return new Response<GetAllCVUngViensViewModel>("Không tìm thấy CV."); return new Response<GetAllCVUngViensViewModel>(mapper.Map<GetAllCVUngViensViewModel>(entity)); }
}
