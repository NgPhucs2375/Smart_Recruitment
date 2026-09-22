using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KyNang.Queries.GetAllKyNangs
{
    public class GetAllKyNangsQuery : IRequest<Response<List<GetAllKyNangsViewModel>>>
    {
        public int _start { get; set; }
        public int _end { get; set; }
        public string _order { get; set; }
        public string _sort { get; set; }
        public string _filter { get; set; }
    }

    public class GetAllKyNangsQueryHandler(
        IApplicationDbContext context,
        IMapper mapper)
        : IRequestHandler<GetAllKyNangsQuery, Response<List<GetAllKyNangsViewModel>>>
    {
        public async Task<Response<List<GetAllKyNangsViewModel>>> Handle(
            GetAllKyNangsQuery request,
            CancellationToken cancellationToken)
        {
            var query = context.KyNangs.AsNoTracking();

            var filter = request._filter?.Trim();

            if (!string.IsNullOrWhiteSpace(filter))
            {
                query = query.Where(x => x.TenKyNang.Contains(filter));
            }

            query = request._sort?.ToLower() switch
            {
                "tenkynang" => request._order?.ToLower() == "desc"
                    ? query.OrderByDescending(x => x.TenKyNang)
                    : query.OrderBy(x => x.TenKyNang),
                _ => query.OrderBy(x => x.Id)
            };

            var skip = request._start < 0 ? 0 : request._start;
            var take = request._end - skip;

            if (skip > 0)
            {
                query = query.Skip(skip);
            }

            if (take > 0)
            {
                query = query.Take(take);
            }

            var items = await query.ToListAsync(
                cancellationToken);

            var result = mapper.Map<List<GetAllKyNangsViewModel>>(items);

            return new Response<List<GetAllKyNangsViewModel>>(result);
        }
    }
}
