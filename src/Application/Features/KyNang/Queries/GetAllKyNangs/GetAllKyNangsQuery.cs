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

    public class GetAllKyNangsQueryHandler : IRequestHandler<GetAllKyNangsQuery, Response<List<GetAllKyNangsViewModel>>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetAllKyNangsQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Response<List<GetAllKyNangsViewModel>>> Handle(GetAllKyNangsQuery request, CancellationToken cancellationToken)
        {
            var query = _context.KyNangs.AsQueryable();

            if (!string.IsNullOrWhiteSpace(request._filter))
            {
                query = query.Where(x => x.TenKyNang.Contains(request._filter));
            }

            query = request._sort?.ToLower() switch
            {
                "tenkynang" => request._order?.ToLower() == "desc" ? query.OrderByDescending(x => x.TenKyNang) : query.OrderBy(x => x.TenKyNang),
                _ => query.OrderBy(x => x.Id)
            };

            var skip = request._start;
            var take = request._end - request._start;
            if (take > 0)
                query = query.Skip(skip).Take(take);

            var items = await query.ToListAsync(cancellationToken);
            var result = _mapper.Map<List<GetAllKyNangsViewModel>>(items);
            return new Response<List<GetAllKyNangsViewModel>>(result);
        }
    }
}
