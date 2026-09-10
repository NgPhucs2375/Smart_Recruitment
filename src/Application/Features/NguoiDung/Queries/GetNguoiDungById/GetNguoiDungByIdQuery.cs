using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.NguoiDung.Queries.GetNguoiDungById
{
    public class GetNguoiDungByIdQuery : IRequest<Response<GetAllNguoiDungs.GetAllNguoiDungsViewModel>>
    {
        public int Id { get; set; }
    }

    public class GetNguoiDungByIdQueryHandler : IRequestHandler<GetNguoiDungByIdQuery, Response<GetAllNguoiDungs.GetAllNguoiDungsViewModel>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetNguoiDungByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Response<GetAllNguoiDungs.GetAllNguoiDungsViewModel>> Handle(GetNguoiDungByIdQuery request, CancellationToken cancellationToken)
        {
            var entity = await _context.NguoiDungs.FindAsync(request.Id);
            if (entity == null)
                return new Response<GetAllNguoiDungs.GetAllNguoiDungsViewModel>("Không tìm thấy người dùng.");

            var result = _mapper.Map<GetAllNguoiDungs.GetAllNguoiDungsViewModel>(entity);
            return new Response<GetAllNguoiDungs.GetAllNguoiDungsViewModel>(result);
        }
    }
}
