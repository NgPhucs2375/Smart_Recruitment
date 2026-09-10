using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KyNangUngVien.Queries.GetAllKyNangUngViens
{
    public class GetAllKyNangUngViensQuery : IRequest<Response<List<GetAllKyNangUngViensViewModel>>>
    {
        public int _start { get; set; }
        public int _end { get; set; }
        public string _order { get; set; }
        public string _sort { get; set; }
        public string _filter { get; set; }
    }

    public class GetAllKyNangUngViensQueryHandler : IRequestHandler<GetAllKyNangUngViensQuery, Response<List<GetAllKyNangUngViensViewModel>>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetAllKyNangUngViensQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Response<List<GetAllKyNangUngViensViewModel>>> Handle(GetAllKyNangUngViensQuery request, CancellationToken cancellationToken)
        {
            var query = _context.KyNangUngViens.AsQueryable();

            if (!string.IsNullOrWhiteSpace(request._filter))
            {
                if (int.TryParse(request._filter, out var idFilter))
                {
                    query = query.Where(x => x.HoSoUngVienId == idFilter || x.KyNangId == idFilter);
                }
            }

            query = request._sort?.ToLower() switch
            {
                "hosoungvienid" => request._order?.ToLower() == "desc" ? query.OrderByDescending(x => x.HoSoUngVienId) : query.OrderBy(x => x.HoSoUngVienId),
                "kynangid" => request._order?.ToLower() == "desc" ? query.OrderByDescending(x => x.KyNangId) : query.OrderBy(x => x.KyNangId),
                "sonamkinhnghiem" => request._order?.ToLower() == "desc" ? query.OrderByDescending(x => x.SoNamKinhNghiem) : query.OrderBy(x => x.SoNamKinhNghiem),
                _ => query.OrderBy(x => x.Id)
            };

            var skip = request._start;
            var take = request._end - request._start;
            if (take > 0)
                query = query.Skip(skip).Take(take);

            var items = await query.ToListAsync(cancellationToken);
            var result = _mapper.Map<List<GetAllKyNangUngViensViewModel>>(items);
            return new Response<List<GetAllKyNangUngViensViewModel>>(result);
        }
    }
}
