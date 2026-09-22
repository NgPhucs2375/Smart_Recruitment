using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KyNang.Queries.GetKyNangById
{
    public class GetKyNangByIdQuery : IRequest<Response<GetAllKyNangs.GetAllKyNangsViewModel>>
    {
        public int Id { get; set; }
    }

    public class GetKyNangByIdQueryHandler(
        IApplicationDbContext context,
        IMapper mapper)
        : IRequestHandler<GetKyNangByIdQuery, Response<GetAllKyNangs.GetAllKyNangsViewModel>>
    {
        public async Task<Response<GetAllKyNangs.GetAllKyNangsViewModel>> Handle(
            GetKyNangByIdQuery request,
            CancellationToken cancellationToken)
        {
            var entity = await context.KyNangs
                .FindAsync([request.Id], cancellationToken);

            if (entity == null)
            {
                return new Response<GetAllKyNangs.GetAllKyNangsViewModel>(
                    "Không tìm thấy kỹ năng.");
            }

            var result = mapper.Map<GetAllKyNangs.GetAllKyNangsViewModel>(
                entity);

            return new Response<GetAllKyNangs.GetAllKyNangsViewModel>(
                result);
        }
    }
}
