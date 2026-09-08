using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.ThongBao.Queries.GetThongBaoById
{
    public class GetThongBaoByIdQuery : IRequest<Response<GetAllThongBaos.GetAllThongBaosViewModel>>
    {
        public int Id { get; set; }
    }

    public class GetThongBaoByIdQueryHandler : IRequestHandler<GetThongBaoByIdQuery, Response<GetAllThongBaos.GetAllThongBaosViewModel>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetThongBaoByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Response<GetAllThongBaos.GetAllThongBaosViewModel>> Handle(GetThongBaoByIdQuery request, CancellationToken cancellationToken)
        {
            var entity = await _context.ThongBaos.FindAsync(request.Id);
            if (entity == null)
                return new Response<GetAllThongBaos.GetAllThongBaosViewModel>("Không tìm thấy thông báo.");

            var result = _mapper.Map<GetAllThongBaos.GetAllThongBaosViewModel>(entity);
            return new Response<GetAllThongBaos.GetAllThongBaosViewModel>(result);
        }
    }
}
