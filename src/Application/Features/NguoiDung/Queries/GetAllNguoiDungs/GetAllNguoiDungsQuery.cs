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

    public class GetAllNguoiDungsQueryHandler : IRequestHandler<GetAllNguoiDungsQuery, Response<List<GetAllNguoiDungsViewModel>>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetAllNguoiDungsQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Response<List<GetAllNguoiDungsViewModel>>> Handle(GetAllNguoiDungsQuery request, CancellationToken cancellationToken)
        {
            var query = _context.NguoiDungs.AsQueryable();

            if (!string.IsNullOrWhiteSpace(request._filter))
            {
                query = query.Where(x => x.ApplicationUserId.Contains(request._filter));
            }

            query = request._sort?.ToLower() switch
            {
                "vaitro" => request._order?.ToLower() == "desc"
                    ? query.OrderByDescending(x => x.VaiTro)
                    : query.OrderBy(x => x.VaiTro),
                _ => query.OrderBy(x => x.Id)
            };

            var skip = request._start;
            var take = request._end - request._start;
            if (take > 0)
                query = query.Skip(skip).Take(take);

            var items = await query.ToListAsync(cancellationToken);
            var result = _mapper.Map<List<GetAllNguoiDungsViewModel>>(items);

            return new Response<List<GetAllNguoiDungsViewModel>>(result);
        }
    }
}
