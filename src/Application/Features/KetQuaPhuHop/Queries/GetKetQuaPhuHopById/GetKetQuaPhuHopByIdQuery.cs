using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KetQuaPhuHop.Queries.GetKetQuaPhuHopById
{
    public class GetKetQuaPhuHopByIdQuery : IRequest<Response<GetAllKetQuaPhuHops.GetAllKetQuaPhuHopsViewModel>>
    {
        public int Id { get; set; }
    }

    public class GetKetQuaPhuHopByIdQueryHandler(
        IApplicationDbContext context,
        IMapper mapper)
        : IRequestHandler<GetKetQuaPhuHopByIdQuery, Response<GetAllKetQuaPhuHops.GetAllKetQuaPhuHopsViewModel>>
    {
        public async Task<Response<GetAllKetQuaPhuHops.GetAllKetQuaPhuHopsViewModel>> Handle(
            GetKetQuaPhuHopByIdQuery request,
            CancellationToken cancellationToken)
        {
            var entity = await context.KetQuaPhuHops
                .FindAsync([request.Id], cancellationToken);

            if (entity == null)
            {
                return new Response<GetAllKetQuaPhuHops.GetAllKetQuaPhuHopsViewModel>(
                    "Không tìm thấy kết quả phù hợp.");
            }

            var result = mapper.Map<GetAllKetQuaPhuHops.GetAllKetQuaPhuHopsViewModel>(
                entity);

            return new Response<GetAllKetQuaPhuHops.GetAllKetQuaPhuHopsViewModel>(
                result);
        }
    }
}
