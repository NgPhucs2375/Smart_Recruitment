using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KinhNghiemLamViec.Queries.GetKinhNghiemLamViecById
{
    public class GetKinhNghiemLamViecByIdQuery : IRequest<Response<GetAllKinhNghiemLamViecs.GetAllKinhNghiemLamViecsViewModel>>
    {
        public int Id { get; set; }
    }

    public class GetKinhNghiemLamViecByIdQueryHandler : IRequestHandler<GetKinhNghiemLamViecByIdQuery, Response<GetAllKinhNghiemLamViecs.GetAllKinhNghiemLamViecsViewModel>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetKinhNghiemLamViecByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Response<GetAllKinhNghiemLamViecs.GetAllKinhNghiemLamViecsViewModel>> Handle(GetKinhNghiemLamViecByIdQuery request, CancellationToken cancellationToken)
        {
            var entity = await _context.KinhNghiemLamViecs.FindAsync(request.Id);
            if (entity == null)
                return new Response<GetAllKinhNghiemLamViecs.GetAllKinhNghiemLamViecsViewModel>("Khong tim thay kinh nghiem lam viec.");

            var result = _mapper.Map<GetAllKinhNghiemLamViecs.GetAllKinhNghiemLamViecsViewModel>(entity);
            return new Response<GetAllKinhNghiemLamViecs.GetAllKinhNghiemLamViecsViewModel>(result);
        }
    }
}
