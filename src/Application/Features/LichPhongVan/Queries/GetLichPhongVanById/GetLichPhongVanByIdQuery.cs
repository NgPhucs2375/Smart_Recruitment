using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.LichPhongVan.Queries.GetLichPhongVanById
{
    public class GetLichPhongVanByIdQuery : IRequest<Response<GetAllLichPhongVans.GetAllLichPhongVansViewModel>>
    {
        public int Id { get; set; }
    }

    public class GetLichPhongVanByIdQueryHandler : IRequestHandler<GetLichPhongVanByIdQuery, Response<GetAllLichPhongVans.GetAllLichPhongVansViewModel>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetLichPhongVanByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Response<GetAllLichPhongVans.GetAllLichPhongVansViewModel>> Handle(GetLichPhongVanByIdQuery request, CancellationToken cancellationToken)
        {
            var entity = await _context.LichPhongVans.FindAsync(request.Id);
            if (entity == null)
                return new Response<GetAllLichPhongVans.GetAllLichPhongVansViewModel>("Không tìm thấy lịch phỏng vấn.");

            var result = _mapper.Map<GetAllLichPhongVans.GetAllLichPhongVansViewModel>(entity);
            return new Response<GetAllLichPhongVans.GetAllLichPhongVansViewModel>(result);
        }
    }
}
