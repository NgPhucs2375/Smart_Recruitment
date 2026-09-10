using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.TinTuyenDung.Queries.GetAllTinTuyenDungs
{
    public class GetAllTinTuyenDungsQuery : IRequest<Response<List<GetAllTinTuyenDungsViewModel>>>
    {
        public int _start { get; set; }
        public int _end { get; set; }
        public string _order { get; set; }
        public string _sort { get; set; }
        public string _filter { get; set; }
    }

    public class GetAllTinTuyenDungsQueryHandler : IRequestHandler<GetAllTinTuyenDungsQuery, Response<List<GetAllTinTuyenDungsViewModel>>>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentNguoiDungService _current;

        public GetAllTinTuyenDungsQueryHandler(IApplicationDbContext context, ICurrentNguoiDungService current)
        {
            _context = context;
            _current = current;
        }

        public async Task<Response<List<GetAllTinTuyenDungsViewModel>>> Handle(GetAllTinTuyenDungsQuery q, CancellationToken ct)
        {
            var ctx = await _current.ResolveAsync();

            var query = _context.TinTuyenDungs.AsQueryable();

            if (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU)
                query = query.Where(t => t.NguoiDangTinId == ctx.Id);
            else if (ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
                query = query.Where(t => t.DoanhNghiepId == ctx.DoanhNghiepId);
            else // UNG_VIEN: chỉ tin công khai
                query = query.Where(t => t.TrangThai == TrangThaiTinTuyenDung.DangTuyen);

            if (!string.IsNullOrWhiteSpace(q._filter))
                query = query.Where(t => t.TieuDe.Contains(q._filter));

            query = q._sort?.ToLower() switch
            {
                "tieude" => q._order?.ToLower() == "desc" ? query.OrderByDescending(t => t.TieuDe) : query.OrderBy(t => t.TieuDe),
                _ => query.OrderByDescending(t => t.Id)
            };

            var skip = q._start;
            var take = q._end - q._start;
            if (take > 0)
                query = query.Skip(skip).Take(take);

            var items = await query.Select(t => new GetAllTinTuyenDungsViewModel
            {
                Id = t.Id,
                TieuDe = t.TieuDe,
                DiaDiemLamViec = t.DiaDiemLamViec,
                LuongToiThieu = t.LuongToiThieu,
                LuongToiDa = t.LuongToiDa,
                TrangThai = t.TrangThai.ToString(),
                NgayHetHan = t.NgayHetHan,
                NguoiDangTinId = t.NguoiDangTinId,
                DoanhNghiepId = t.DoanhNghiepId
            }).ToListAsync(ct);

            return new Response<List<GetAllTinTuyenDungsViewModel>>(items);
        }
    }
}
