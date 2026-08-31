using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System;
using Domain.Enums;

namespace Application.Features.KetQuaPhuHop.Queries.GetAllKetQuaPhuHops
{
    public class GetAllKetQuaPhuHopsQuery : IRequest<Response<List<GetAllKetQuaPhuHopsViewModel>>>
    {
        public int _start { get; set; }
        public int _end { get; set; }
        public string _order { get; set; }
        public string _sort { get; set; }
        public string _filter { get; set; }
    }

    public class GetAllKetQuaPhuHopsQueryHandler : IRequestHandler<GetAllKetQuaPhuHopsQuery, Response<List<GetAllKetQuaPhuHopsViewModel>>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetAllKetQuaPhuHopsQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Response<List<GetAllKetQuaPhuHopsViewModel>>> Handle(GetAllKetQuaPhuHopsQuery request, CancellationToken cancellationToken)
        {
            var query = _context.KetQuaPhuHops.AsQueryable();

            if (!string.IsNullOrWhiteSpace(request._filter))
            {
                if (int.TryParse(request._filter, out var idFilter))
                {
                    query = query.Where(x => x.HoSoUngVienId == idFilter || x.TinTuyenDungId == idFilter);
                }
                else if (Enum.TryParse<PhanLoaiKetQua>(request._filter, true, out var phanLoai))
                {
                    query = query.Where(x => x.PhanLoai == phanLoai);
                }
            }

            query = request._sort?.ToLower() switch
            {
                "diemphuhop" => request._order?.ToLower() == "desc" ? query.OrderByDescending(x => x.DiemPhuHop) : query.OrderBy(x => x.DiemPhuHop),
                "ngaydanhgia" => request._order?.ToLower() == "desc" ? query.OrderByDescending(x => x.NgayDanhGia) : query.OrderBy(x => x.NgayDanhGia),
                "phanloai" => request._order?.ToLower() == "desc" ? query.OrderByDescending(x => x.PhanLoai) : query.OrderBy(x => x.PhanLoai),
                _ => query.OrderBy(x => x.Id)
            };

            var skip = request._start;
            var take = request._end - request._start;
            if (take > 0)
                query = query.Skip(skip).Take(take);

            var items = await query.ToListAsync(cancellationToken);
            var result = _mapper.Map<List<GetAllKetQuaPhuHopsViewModel>>(items);
            return new Response<List<GetAllKetQuaPhuHopsViewModel>>(result);
        }
    }
}
