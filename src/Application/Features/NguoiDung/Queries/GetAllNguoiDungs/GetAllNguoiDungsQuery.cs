using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.NguoiDung.Queries.GetAllNguoiDungs
{
    public class GetAllNguoiDungsQuery : IRequest<Response<List<GetAllNguoiDungsViewModel>>>
    {
        public int _start { get; set; }
        public int _end { get; set; }
        public string _order { get; set; }
        public string _sort { get; set; }
        public string _filter { get; set; }
    }

    public class GetAllNguoiDungsQueryHandler(
        IApplicationDbContext context,
        IMapper mapper)
        : IRequestHandler<GetAllNguoiDungsQuery, Response<List<GetAllNguoiDungsViewModel>>>
    {
        public async Task<Response<List<GetAllNguoiDungsViewModel>>> Handle(
            GetAllNguoiDungsQuery request,
            CancellationToken cancellationToken)
        {
            var query = context.NguoiDungs.AsNoTracking();

            var filter = request._filter?.Trim();

            if (!string.IsNullOrWhiteSpace(filter))
            {
                query = query.Where(x => x.ApplicationUserId.Contains(filter));
            }

            query = request._sort?.ToLower() switch
            {
                "vaitro" => request._order?.ToLower() == "desc"
                    ? query.OrderByDescending(x => x.VaiTro)
                    : query.OrderBy(x => x.VaiTro),
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

            var result = mapper.Map<List<GetAllNguoiDungsViewModel>>(items);

            return new Response<List<GetAllNguoiDungsViewModel>>(result);
        }
    }
}
