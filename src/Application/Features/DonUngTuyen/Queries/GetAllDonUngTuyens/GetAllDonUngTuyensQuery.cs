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
            var query = _context.DonUngTuyens.AsQueryable();

            if (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU)
                query = query.Where(d => d.TinTuyenDung.NguoiDangTinId == ctx.Id);
            else if (ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
                query = query.Where(d => d.TinTuyenDung.DoanhNghiepId == ctx.DoanhNghiepId);
            else if (ctx.VaiTro == VaiTroNguoiDung.UNG_VIEN)
                query = query.Where(d => d.HoSoUngVien.NguoiDungId == ctx.Id);

            if (!string.IsNullOrWhiteSpace(q._filter))
                query = query.Where(d => d.GhiChu.Contains(q._filter));

            query = q._sort?.ToLower() switch
            {
                "trangthai" => q._order?.ToLower() == "desc"
                    ? query.OrderByDescending(d => d.TrangThai)
                    : query.OrderBy(d => d.TrangThai),
                _ => query.OrderByDescending(d => d.Id)
            };

            var skip = q._start;
            var take = q._end - q._start;
            if (take > 0)
                query = query.Skip(skip).Take(take);

            var items = await query.Select(d => new GetAllDonUngTuyensViewModel
            {
                Id = d.Id,
                HoSoUngVienId = d.HoSoUngVienId,
                TinTuyenDungId = d.TinTuyenDungId,
                TrangThai = d.TrangThai.ToString(),
                GhiChu = d.GhiChu
            }).ToListAsync(ct);

            return new Response<List<GetAllDonUngTuyensViewModel>>(items);
        }
    }
}
