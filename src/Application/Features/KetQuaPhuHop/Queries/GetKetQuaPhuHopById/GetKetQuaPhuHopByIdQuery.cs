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

    public class GetKetQuaPhuHopByIdQueryHandler : IRequestHandler<GetKetQuaPhuHopByIdQuery, Response<GetAllKetQuaPhuHops.GetAllKetQuaPhuHopsViewModel>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetKetQuaPhuHopByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Response<GetAllKetQuaPhuHops.GetAllKetQuaPhuHopsViewModel>> Handle(GetKetQuaPhuHopByIdQuery request, CancellationToken cancellationToken)
        {
            var entity = await _context.KetQuaPhuHops.FindAsync(request.Id);
            if (entity == null)
                return new Response<GetAllKetQuaPhuHops.GetAllKetQuaPhuHopsViewModel>("Khong tim thay ket qua phu hop.");

            var result = _mapper.Map<GetAllKetQuaPhuHops.GetAllKetQuaPhuHopsViewModel>(entity);
            return new Response<GetAllKetQuaPhuHops.GetAllKetQuaPhuHopsViewModel>(result);
        }
    }
}
