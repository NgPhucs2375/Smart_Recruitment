using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KyNangTinTuyenDung.Queries.GetKyNangTinTuyenDungById
{
    public class GetKyNangTinTuyenDungByIdQuery : IRequest<Response<GetAllKyNangTinTuyenDungs.GetAllKyNangTinTuyenDungsViewModel>>
    {
        public int Id { get; set; }
    }

    public class GetKyNangTinTuyenDungByIdQueryHandler : IRequestHandler<GetKyNangTinTuyenDungByIdQuery, Response<GetAllKyNangTinTuyenDungs.GetAllKyNangTinTuyenDungsViewModel>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetKyNangTinTuyenDungByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Response<GetAllKyNangTinTuyenDungs.GetAllKyNangTinTuyenDungsViewModel>> Handle(GetKyNangTinTuyenDungByIdQuery request, CancellationToken cancellationToken)
        {
            var entity = await _context.KyNangTinTuyenDungs.FindAsync(request.Id);
            if (entity == null)
                return new Response<GetAllKyNangTinTuyenDungs.GetAllKyNangTinTuyenDungsViewModel>("Khong tim thay ky nang tin tuyen dung.");

            var result = _mapper.Map<GetAllKyNangTinTuyenDungs.GetAllKyNangTinTuyenDungsViewModel>(entity);
            return new Response<GetAllKyNangTinTuyenDungs.GetAllKyNangTinTuyenDungsViewModel>(result);
        }
    }
}
