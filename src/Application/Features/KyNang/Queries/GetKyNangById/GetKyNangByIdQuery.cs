using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KyNang.Queries.GetKyNangById
{
    public class GetKyNangByIdQuery : IRequest<Response<GetAllKyNangs.GetAllKyNangsViewModel>>
    {
        public int Id { get; set; }
    }

    public class GetKyNangByIdQueryHandler : IRequestHandler<GetKyNangByIdQuery, Response<GetAllKyNangs.GetAllKyNangsViewModel>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetKyNangByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Response<GetAllKyNangs.GetAllKyNangsViewModel>> Handle(GetKyNangByIdQuery request, CancellationToken cancellationToken)
        {
            var entity = await _context.KyNangs.FindAsync(request.Id);
            if (entity == null)
                return new Response<GetAllKyNangs.GetAllKyNangsViewModel>("Khong tim thay ky nang.");

            var result = _mapper.Map<GetAllKyNangs.GetAllKyNangsViewModel>(entity);
            return new Response<GetAllKyNangs.GetAllKyNangsViewModel>(result);
        }
    }
}
