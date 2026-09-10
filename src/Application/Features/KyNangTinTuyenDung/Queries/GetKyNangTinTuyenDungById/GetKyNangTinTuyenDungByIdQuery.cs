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

    public class GetKyNangTinTuyenDungByIdQueryHandler(
        IApplicationDbContext context,
        IMapper mapper)
        : IRequestHandler<GetKyNangTinTuyenDungByIdQuery, Response<GetAllKyNangTinTuyenDungs.GetAllKyNangTinTuyenDungsViewModel>>
    {
        public async Task<Response<GetAllKyNangTinTuyenDungs.GetAllKyNangTinTuyenDungsViewModel>> Handle(
            GetKyNangTinTuyenDungByIdQuery request,
            CancellationToken cancellationToken)
        {
            var entity = await context.KyNangTinTuyenDungs
                .FindAsync([request.Id], cancellationToken);

            if (entity == null)
            {
                return new Response<GetAllKyNangTinTuyenDungs.GetAllKyNangTinTuyenDungsViewModel>(
                    "Không tìm thấy kỹ năng tin tuyển dụng.");
            }

            var result = mapper.Map<GetAllKyNangTinTuyenDungs.GetAllKyNangTinTuyenDungsViewModel>(
                entity);

            return new Response<GetAllKyNangTinTuyenDungs.GetAllKyNangTinTuyenDungsViewModel>(
                result);
        }
    }
}
