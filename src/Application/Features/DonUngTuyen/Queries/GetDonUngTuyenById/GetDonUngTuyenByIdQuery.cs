using Application.Features.DonUngTuyen.Queries.GetAllDonUngTuyens;
using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;

namespace Application.Features.DonUngTuyen.Queries.GetDonUngTuyenById;

public class GetDonUngTuyenByIdQuery : IRequest<Response<GetAllDonUngTuyensViewModel>>
{
    public int Id { get; set; }
}

public class GetDonUngTuyenByIdQueryHandler(IApplicationDbContext context, IMapper mapper) 
    : IRequestHandler<GetDonUngTuyenByIdQuery, Response<GetAllDonUngTuyensViewModel>>
{
    public async Task<Response<GetAllDonUngTuyensViewModel>> Handle(GetDonUngTuyenByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await context.DonUngTuyens.FindAsync([request.Id], cancellationToken);
        
        if (entity == null)
        {
            return new Response<GetAllDonUngTuyensViewModel>("Không tìm thấy đơn ứng tuyển.");
        }

        return new Response<GetAllDonUngTuyensViewModel>(mapper.Map<GetAllDonUngTuyensViewModel>(entity));
    }
}