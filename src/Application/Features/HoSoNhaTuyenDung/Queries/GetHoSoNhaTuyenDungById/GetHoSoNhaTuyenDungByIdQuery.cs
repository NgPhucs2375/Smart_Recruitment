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

    public class GetHoSoNhaTuyenDungByIdQueryHandler(
        IApplicationDbContext context,
        IMapper mapper)
        : IRequestHandler<GetHoSoNhaTuyenDungByIdQuery, Response<GetAllHoSoNhaTuyenDungs.GetAllHoSoNhaTuyenDungsViewModel>>
    {
        public async Task<Response<GetAllHoSoNhaTuyenDungs.GetAllHoSoNhaTuyenDungsViewModel>> Handle(
            GetHoSoNhaTuyenDungByIdQuery request,
            CancellationToken cancellationToken)
        {
            var entity = await context.HoSoNhaTuyenDungs
                .FindAsync([request.Id], cancellationToken);

            if (entity == null)
            {
                return new Response<GetAllHoSoNhaTuyenDungs.GetAllHoSoNhaTuyenDungsViewModel>(
                    "Không tìm thấy hồ sơ nhà tuyển dụng.");
            }

            var result = mapper.Map<GetAllHoSoNhaTuyenDungs.GetAllHoSoNhaTuyenDungsViewModel>(
                entity);

            return new Response<GetAllHoSoNhaTuyenDungs.GetAllHoSoNhaTuyenDungsViewModel>(
                result);
        }
    }
}
