using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.HoSoNhaTuyenDung.Queries.GetHoSoNhaTuyenDungById
{
    public class GetHoSoNhaTuyenDungByIdQuery : IRequest<Response<GetAllHoSoNhaTuyenDungs.GetAllHoSoNhaTuyenDungsViewModel>>
    {
        public int Id { get; set; }
    }

    public class GetHoSoNhaTuyenDungByIdQueryHandler : IRequestHandler<GetHoSoNhaTuyenDungByIdQuery, Response<GetAllHoSoNhaTuyenDungs.GetAllHoSoNhaTuyenDungsViewModel>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetHoSoNhaTuyenDungByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Response<GetAllHoSoNhaTuyenDungs.GetAllHoSoNhaTuyenDungsViewModel>> Handle(GetHoSoNhaTuyenDungByIdQuery request, CancellationToken cancellationToken)
        {
            var entity = await _context.HoSoNhaTuyenDungs.FindAsync(request.Id);
            if (entity == null)
                return new Response<GetAllHoSoNhaTuyenDungs.GetAllHoSoNhaTuyenDungsViewModel>("Không tìm thấy hồ sơ nhà tuyển dụng.");

            var result = _mapper.Map<GetAllHoSoNhaTuyenDungs.GetAllHoSoNhaTuyenDungsViewModel>(entity);
            return new Response<GetAllHoSoNhaTuyenDungs.GetAllHoSoNhaTuyenDungsViewModel>(result);
        }
    }
}
