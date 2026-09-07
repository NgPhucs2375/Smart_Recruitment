using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KyNangUngVien.Queries.GetKyNangUngVienById
{
    public class GetKyNangUngVienByIdQuery : IRequest<Response<GetAllKyNangUngViens.GetAllKyNangUngViensViewModel>>
    {
        public int Id { get; set; }
    }

    public class GetKyNangUngVienByIdQueryHandler : IRequestHandler<GetKyNangUngVienByIdQuery, Response<GetAllKyNangUngViens.GetAllKyNangUngViensViewModel>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetKyNangUngVienByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Response<GetAllKyNangUngViens.GetAllKyNangUngViensViewModel>> Handle(GetKyNangUngVienByIdQuery request, CancellationToken cancellationToken)
        {
            var entity = await _context.KyNangUngViens.FindAsync(request.Id);
            if (entity == null)
                return new Response<GetAllKyNangUngViens.GetAllKyNangUngViensViewModel>("Khong tim thay ky nang ung vien.");

            var result = _mapper.Map<GetAllKyNangUngViens.GetAllKyNangUngViensViewModel>(entity);
            return new Response<GetAllKyNangUngViens.GetAllKyNangUngViensViewModel>(result);
        }
    }
}
