using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using Application.Features.DoanhNghiep.Queries.GetAllDoanhNghieps;

namespace Application.Features.DoanhNghiep.Queries.GetMyDoanhNghiep
{
    /// <summary>
    /// Trả về doanh nghiệp của người dùng hiện tại (owner hoặc member qua HoSo).
    /// FE /doanh-nghiep/ho-so dùng endpoint này thay vì lấy items[0] từ list tất cả.
    /// </summary>
    public class GetMyDoanhNghiepQuery : IRequest<Response<GetAllDoanhNghiepsViewModel>> { }

    public class GetMyDoanhNghiepQueryHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current,
        IMapper mapper)
        : IRequestHandler<GetMyDoanhNghiepQuery, Response<GetAllDoanhNghiepsViewModel>>
    {
        public async Task<Response<GetAllDoanhNghiepsViewModel>> Handle(
            GetMyDoanhNghiepQuery request,
            CancellationToken cancellationToken)
        {
            var ctx = await current.ResolveAsync();

            Domain.Entities.DoanhNghiep entity = null;
            if (ctx.DoanhNghiepId.HasValue)
            {
                entity = await context.DoanhNghieps
                    .AsNoTracking()
                    .FirstOrDefaultAsync(d => d.Id == ctx.DoanhNghiepId.Value, cancellationToken);
            }

            if (entity == null)
                return new Response<GetAllDoanhNghiepsViewModel>("Chưa có thông tin doanh nghiệp.");

            return new Response<GetAllDoanhNghiepsViewModel>(
                mapper.Map<GetAllDoanhNghiepsViewModel>(entity));
        }
    }
}
