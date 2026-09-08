using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.DonUngTuyen.Queries.GetAllDonUngTuyens
{
    public class GetAllDonUngTuyensQuery : IRequest<Response<List<GetAllDonUngTuyensViewModel>>>
    {
        public int _start { get; set; }
        public int _end { get; set; }
        public string _order { get; set; }
        public string _sort { get; set; }
        public string _filter { get; set; }
        public int? HoSoUngVienId { get; set; }
        public int? TinTuyenDungId { get; set; }
    }

    public class GetAllDonUngTuyensQueryHandler : IRequestHandler<GetAllDonUngTuyensQuery, Response<List<GetAllDonUngTuyensViewModel>>>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentNguoiDungService _current;

        public GetAllDonUngTuyensQueryHandler(IApplicationDbContext context, ICurrentNguoiDungService current)
        {
            _context = context;
            _current = current;
        }

        public async Task<Response<List<GetAllDonUngTuyensViewModel>>> Handle(GetAllDonUngTuyensQuery q, CancellationToken ct)
        {
            var ctx = await _current.ResolveAsync();
            var query = _context.DonUngTuyens.AsNoTracking().AsQueryable();

            // QUAN_TRI_VIEN: xem tất cả, không lọc thêm
            if (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU)
                query = query.Where(d => d.TinTuyenDung.NguoiDangTinId == ctx.Id);
            else if (ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
                query = query.Where(d => d.TinTuyenDung.DoanhNghiepId == ctx.DoanhNghiepId);
            else if (ctx.VaiTro == VaiTroNguoiDung.UNG_VIEN)
                query = query.Where(d => d.HoSoUngVien.NguoiDungId == ctx.Id);

            if (q.HoSoUngVienId.HasValue)
            {
                query = query.Where(x => x.HoSoUngVienId == q.HoSoUngVienId.Value);
            }

            if (q.TinTuyenDungId.HasValue)
            {
                query = query.Where(x => x.TinTuyenDungId == q.TinTuyenDungId.Value);
            }

            if (!string.IsNullOrWhiteSpace(q._filter))
                query = query.Where(d => d.GhiChu != null && d.GhiChu.Contains(q._filter));

            query = q._sort?.ToLower() switch
            {
                "trangthai" => q._order?.ToLower() == "desc"
                    ? query.OrderByDescending(d => d.TrangThai)
                    : query.OrderBy(d => d.TrangThai),
                _ => query.OrderByDescending(d => d.Id)
            };

            var skip = q._start < 0 ? 0 : q._start;
            var take = q._end - skip;
            if (skip > 0)
                query = query.Skip(skip);
            if (take > 0)
                query = query.Take(take);

            var items = await query.Select(d => new GetAllDonUngTuyensViewModel
            {
                Id = d.Id,
                HoSoUngVienId = d.HoSoUngVienId,
                TinTuyenDungId = d.TinTuyenDungId,
                CVUngVienId = d.CVUngVienId,
                TrangThai = d.TrangThai,
                GhiChu = d.GhiChu
            }).ToListAsync(ct);

            return new Response<List<GetAllDonUngTuyensViewModel>>(items);
        }
    }
}
