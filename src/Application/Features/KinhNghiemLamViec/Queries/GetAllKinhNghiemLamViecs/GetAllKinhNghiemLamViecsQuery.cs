using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KinhNghiemLamViec.Queries.GetAllKinhNghiemLamViecs
{
    public class GetAllKinhNghiemLamViecsQuery : IRequest<Response<List<GetAllKinhNghiemLamViecsViewModel>>>
    {
        public int _start { get; set; }
        public int _end { get; set; }
        public string _order { get; set; }
        public string _sort { get; set; }
        public string _filter { get; set; }
    }

    public class GetAllKinhNghiemLamViecsQueryHandler : IRequestHandler<GetAllKinhNghiemLamViecsQuery, Response<List<GetAllKinhNghiemLamViecsViewModel>>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetAllKinhNghiemLamViecsQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Response<List<GetAllKinhNghiemLamViecsViewModel>>> Handle(GetAllKinhNghiemLamViecsQuery request, CancellationToken cancellationToken)
        {
            var query = _context.KinhNghiemLamViecs.AsQueryable();

            if (!string.IsNullOrWhiteSpace(request._filter))
            {
                query = query.Where(x => x.TenCongTy.Contains(request._filter)
                    || (x.DiaChi != null && x.DiaChi.Contains(request._filter)));
            }

            query = request._sort?.ToLower() switch
            {
                "tencongty" => request._order?.ToLower() == "desc" ? query.OrderByDescending(x => x.TenCongTy) : query.OrderBy(x => x.TenCongTy),
                "tungay" => request._order?.ToLower() == "desc" ? query.OrderByDescending(x => x.TuNgay) : query.OrderBy(x => x.TuNgay),
                "denngay" => request._order?.ToLower() == "desc" ? query.OrderByDescending(x => x.DenNgay) : query.OrderBy(x => x.DenNgay),
                _ => query.OrderBy(x => x.Id)
            };

            var skip = request._start;
            var take = request._end - request._start;
            if (take > 0)
                query = query.Skip(skip).Take(take);

            var items = await query.ToListAsync(cancellationToken);
            var result = _mapper.Map<List<GetAllKinhNghiemLamViecsViewModel>>(items);
            return new Response<List<GetAllKinhNghiemLamViecsViewModel>>(result);
        }
    }
}
