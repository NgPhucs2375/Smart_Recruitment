using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.HoSoUngVien.Queries.GetHoSoUngVienById
{
    public class GetHoSoUngVienByIdQuery : IRequest<Response<GetAllHoSoUngViens.GetAllHoSoUngViensViewModel>>
    {
        public int Id { get; set; }
    }

    public class GetHoSoUngVienByIdQueryHandler : IRequestHandler<GetHoSoUngVienByIdQuery, Response<GetAllHoSoUngViens.GetAllHoSoUngViensViewModel>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetHoSoUngVienByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Response<GetAllHoSoUngViens.GetAllHoSoUngViensViewModel>> Handle(GetHoSoUngVienByIdQuery request, CancellationToken cancellationToken)
        {
            var entity = await _context.HoSoUngViens.FindAsync(request.Id);
            if (entity == null)
                return new Response<GetAllHoSoUngViens.GetAllHoSoUngViensViewModel>("Không tìm thấy hồ sơ ứng viên.");

            var result = _mapper.Map<GetAllHoSoUngViens.GetAllHoSoUngViensViewModel>(entity);
            return new Response<GetAllHoSoUngViens.GetAllHoSoUngViensViewModel>(result);
        }
    }
}
