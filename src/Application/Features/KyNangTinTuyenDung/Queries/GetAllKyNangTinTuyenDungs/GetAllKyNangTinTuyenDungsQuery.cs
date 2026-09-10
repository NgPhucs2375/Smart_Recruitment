using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KyNangTinTuyenDung.Queries.GetAllKyNangTinTuyenDungs
{
    public class GetAllKyNangTinTuyenDungsQuery : IRequest<Response<List<GetAllKyNangTinTuyenDungsViewModel>>>
    {
        public int _start { get; set; }
        public int _end { get; set; }
        public string _order { get; set; }
        public string _sort { get; set; }
        public string _filter { get; set; }
    }

    public class GetAllKyNangTinTuyenDungsQueryHandler : IRequestHandler<GetAllKyNangTinTuyenDungsQuery, Response<List<GetAllKyNangTinTuyenDungsViewModel>>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetAllKyNangTinTuyenDungsQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Response<List<GetAllKyNangTinTuyenDungsViewModel>>> Handle(GetAllKyNangTinTuyenDungsQuery request, CancellationToken cancellationToken)
        {
            var query = _context.KyNangTinTuyenDungs.AsQueryable();

            if (!string.IsNullOrWhiteSpace(request._filter))
            {
                if (int.TryParse(request._filter, out var idFilter))
                {
                    query = query.Where(x => x.TinTuyenDungId == idFilter || x.KyNangId == idFilter);
                }
                else if (Enum.TryParse<MucDoYC>(request._filter, true, out var mucDo))
                {
                    query = query.Where(x => x.MucDoYeuCau == mucDo);
                }
            }

            query = request._sort?.ToLower() switch
            {
                "tintuyendungid" => request._order?.ToLower() == "desc" ? query.OrderByDescending(x => x.TinTuyenDungId) : query.OrderBy(x => x.TinTuyenDungId),
                "kynangid" => request._order?.ToLower() == "desc" ? query.OrderByDescending(x => x.KyNangId) : query.OrderBy(x => x.KyNangId),
                "mucdoyeucau" => request._order?.ToLower() == "desc" ? query.OrderByDescending(x => x.MucDoYeuCau) : query.OrderBy(x => x.MucDoYeuCau),
                _ => query.OrderBy(x => x.Id)
            };

            var skip = request._start;
            var take = request._end - request._start;
            if (take > 0)
                query = query.Skip(skip).Take(take);

            var items = await query.ToListAsync(cancellationToken);
            var result = _mapper.Map<List<GetAllKyNangTinTuyenDungsViewModel>>(items);
            return new Response<List<GetAllKyNangTinTuyenDungsViewModel>>(result);
        }
    }
}
