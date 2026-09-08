using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.LichPhongVan.Queries.GetAllLichPhongVans
{
    public class GetAllLichPhongVansQuery : IRequest<Response<List<GetAllLichPhongVansViewModel>>>
    {
        public int _start { get; set; }
        public int _end { get; set; }
        public string _order { get; set; }
        public string _sort { get; set; }
        public string _filter { get; set; }
    }

    public class GetAllLichPhongVansQueryHandler : IRequestHandler<GetAllLichPhongVansQuery, Response<List<GetAllLichPhongVansViewModel>>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetAllLichPhongVansQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Response<List<GetAllLichPhongVansViewModel>>> Handle(GetAllLichPhongVansQuery request, CancellationToken cancellationToken)
        {
            var query = _context.LichPhongVans.AsQueryable();

            if (!string.IsNullOrWhiteSpace(request._filter))
            {
                query = query.Where(x => x.DiaDiem.Contains(request._filter) || (x.GhiChu != null && x.GhiChu.Contains(request._filter)));
            }

            query = request._sort?.ToLower() switch
            {
                "thoi_gian_phong_van" => request._order?.ToLower() == "desc"
                    ? query.OrderByDescending(x => x.ThoiGianPhongVan)
                    : query.OrderBy(x => x.ThoiGianPhongVan),
                _ => query.OrderByDescending(x => x.Id)
            };

            var skip = request._start;
            var take = request._end - request._start;
            if (take > 0)
                query = query.Skip(skip).Take(take);

            var items = await query.ToListAsync(cancellationToken);
            var result = _mapper.Map<List<GetAllLichPhongVansViewModel>>(items);

            return new Response<List<GetAllLichPhongVansViewModel>>(result);
        }
    }
}
