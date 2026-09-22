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

    public class GetNguoiDungByIdQueryHandler(
        IApplicationDbContext context,
        IMapper mapper)
        : IRequestHandler<GetNguoiDungByIdQuery, Response<GetAllNguoiDungs.GetAllNguoiDungsViewModel>>
    {
        public async Task<Response<GetAllNguoiDungs.GetAllNguoiDungsViewModel>> Handle(
            GetNguoiDungByIdQuery request,
            CancellationToken cancellationToken)
        {
            var entity = await context.NguoiDungs
                .FindAsync([request.Id], cancellationToken);

            if (entity == null)
            {
                return new Response<GetAllNguoiDungs.GetAllNguoiDungsViewModel>(
                    "Không tìm thấy người dùng.");
            }

            var result = mapper.Map<GetAllNguoiDungs.GetAllNguoiDungsViewModel>(
                entity);

            return new Response<GetAllNguoiDungs.GetAllNguoiDungsViewModel>(
                result);
        }
    }
}
