using Application.Interfaces;
using Application.Security;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Linq;
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
        ICurrentNguoiDungService current,
        IMapper mapper)
        : IRequestHandler<GetKyNangTinTuyenDungByIdQuery, Response<GetAllKyNangTinTuyenDungs.GetAllKyNangTinTuyenDungsViewModel>>
    {
        public async Task<Response<GetAllKyNangTinTuyenDungs.GetAllKyNangTinTuyenDungsViewModel>> Handle(
            GetKyNangTinTuyenDungByIdQuery request,
            CancellationToken cancellationToken)
        {
            var actor = await current.ResolveAsync();
            var entity = await ResourceAccess
                .ScopeJobSkills(context.KyNangTinTuyenDungs.AsNoTracking(), actor)
                .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

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
