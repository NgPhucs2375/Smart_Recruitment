using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.HoSoNhaTuyenDung.Queries.GetAllHoSoNhaTuyenDungs
{
    public class GetAllHoSoNhaTuyenDungsQuery : IRequest<Response<List<GetAllHoSoNhaTuyenDungsViewModel>>>
    {
        public int _start { get; set; }
        public int _end { get; set; }
        public string _order { get; set; }
        public string _sort { get; set; }
        public string _filter { get; set; }
    }

    public class GetAllHoSoNhaTuyenDungsQueryHandler : IRequestHandler<GetAllHoSoNhaTuyenDungsQuery, Response<List<GetAllHoSoNhaTuyenDungsViewModel>>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetAllHoSoNhaTuyenDungsQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Response<List<GetAllHoSoNhaTuyenDungsViewModel>>> Handle(GetAllHoSoNhaTuyenDungsQuery request, CancellationToken cancellationToken)
        {
            var query = _context.HoSoNhaTuyenDungs.AsQueryable();

            if (!string.IsNullOrWhiteSpace(request._filter))
            {
                query = query.Where(x => x.HoTen.Contains(request._filter));
            }

            query = request._sort?.ToLower() switch
            {
                "hoten" => request._order?.ToLower() == "desc"
                    ? query.OrderByDescending(x => x.HoTen)
                    : query.OrderBy(x => x.HoTen),
                _ => query.OrderBy(x => x.Id)
            };

            var skip = request._start;
            var take = request._end - request._start;
            if (take > 0)
                query = query.Skip(skip).Take(take);

            var items = await query.ToListAsync(cancellationToken);
            var result = _mapper.Map<List<GetAllHoSoNhaTuyenDungsViewModel>>(items);

            return new Response<List<GetAllHoSoNhaTuyenDungsViewModel>>(result);
        }
    }
}
