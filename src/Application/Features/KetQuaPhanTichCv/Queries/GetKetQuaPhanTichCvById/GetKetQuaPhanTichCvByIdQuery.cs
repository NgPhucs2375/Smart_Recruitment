using Application.Features.KetQuaPhanTichCv.Queries.GetAllKetQuaPhanTichCvs;
using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;

namespace Application.Features.KetQuaPhanTichCv.Queries.GetKetQuaPhanTichCvById;

public class GetKetQuaPhanTichCvByIdQuery : IRequest<Response<GetAllKetQuaPhanTichCvsViewModel>>
{
    public int Id { get; set; }
}

public class GetKetQuaPhanTichCvByIdQueryHandler(IApplicationDbContext context, IMapper mapper) 
    : IRequestHandler<GetKetQuaPhanTichCvByIdQuery, Response<GetAllKetQuaPhanTichCvsViewModel>>
{
    public async Task<Response<GetAllKetQuaPhanTichCvsViewModel>> Handle(GetKetQuaPhanTichCvByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await context.KetQuaPhanTichCvs.FindAsync([request.Id], cancellationToken);
        
        if (entity == null)
        {
            return new Response<GetAllKetQuaPhanTichCvsViewModel>("Không tìm thấy kết quả phân tích CV.");
        }

        return new Response<GetAllKetQuaPhanTichCvsViewModel>(mapper.Map<GetAllKetQuaPhanTichCvsViewModel>(entity));
    }
}