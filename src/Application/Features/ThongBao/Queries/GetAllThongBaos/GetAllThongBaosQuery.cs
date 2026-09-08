using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.ThongBao.Queries.GetAllThongBaos
{
    public class GetAllThongBaosQuery : IRequest<Response<List<GetAllThongBaosViewModel>>>
    {
        public int _start { get; set; }
        public int _end { get; set; }
        public string _order { get; set; }
        public string _sort { get; set; }
        public string _filter { get; set; }
    }

    public class GetAllThongBaosQueryHandler : IRequestHandler<GetAllThongBaosQuery, Response<List<GetAllThongBaosViewModel>>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetAllThongBaosQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Response<List<GetAllThongBaosViewModel>>> Handle(GetAllThongBaosQuery request, CancellationToken cancellationToken)
        {
            var query = _context.ThongBaos.AsQueryable();

            if (!string.IsNullOrWhiteSpace(request._filter))
            {
                query = query.Where(x => x.TieuDe.Contains(request._filter));
            }

            query = request._sort?.ToLower() switch
            {
                "tieu_de" => request._order?.ToLower() == "desc"
                    ? query.OrderByDescending(x => x.TieuDe)
                    : query.OrderBy(x => x.TieuDe),
                _ => query.OrderByDescending(x => x.Id)
            };

            var skip = request._start;
            var take = request._end - request._start;
            if (take > 0)
                query = query.Skip(skip).Take(take);

            var items = await query.ToListAsync(cancellationToken);
            var result = _mapper.Map<List<GetAllThongBaosViewModel>>(items);

            return new Response<List<GetAllThongBaosViewModel>>(result);
        }
    }
}
