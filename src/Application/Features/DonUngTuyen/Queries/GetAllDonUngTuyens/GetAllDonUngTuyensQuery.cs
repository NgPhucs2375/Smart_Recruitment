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
        public int? CVUngVienId { get; set; }
        public int? TinTuyenDungId { get; set; }
    }

    public class GetAllDonUngTuyensQueryHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current)
        : IRequestHandler<GetAllDonUngTuyensQuery, Response<List<GetAllDonUngTuyensViewModel>>>
    {
        public async Task<Response<List<GetAllDonUngTuyensViewModel>>> Handle(
            GetAllDonUngTuyensQuery request,
            CancellationToken cancellationToken)
        {
            var ctx = await current.ResolveAsync();

            var query = context.DonUngTuyens.AsNoTracking();

            // QUAN_TRI_VIEN: xem tất cả, không lọc thêm
            if (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU)
            {
                query = query.Where(d => d.TinTuyenDung.NguoiDangTinId == ctx.Id);
            }
            else if (ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
            {
                query = query.Where(d => d.TinTuyenDung.DoanhNghiepId == ctx.DoanhNghiepId);
            }
            else if (ctx.VaiTro == VaiTroNguoiDung.UNG_VIEN)
            {
                query = query.Where(d => d.CVUngVien.HoSoUngVien.NguoiDungId == ctx.Id);
            }

            if (request.HoSoUngVienId.HasValue)
            {
                query = query.Where(x => x.CVUngVien.HoSoUngVienId == request.HoSoUngVienId.Value);
            }

            if (request.CVUngVienId.HasValue)
            {
                query = query.Where(x => x.CVUngVienId == request.CVUngVienId.Value);
            }

            if (request.TinTuyenDungId.HasValue)
            {
                query = query.Where(x => x.TinTuyenDungId == request.TinTuyenDungId.Value);
            }

            var filter = request._filter?.Trim();

            if (!string.IsNullOrWhiteSpace(filter))
            {
                query = query.Where(d => d.GhiChu != null && d.GhiChu.Contains(filter));
            }

            query = request._sort?.ToLower() switch
            {
                "trangthai" => request._order?.ToLower() == "desc"
                    ? query.OrderByDescending(d => d.TrangThai)
                    : query.OrderBy(d => d.TrangThai),
                _ => query.OrderByDescending(d => d.Id)
            };

            var skip = request._start < 0 ? 0 : request._start;
            var take = request._end - skip;

            if (skip > 0)
            {
                query = query.Skip(skip);
            }

            if (take > 0)
            {
                query = query.Take(take);
            }

            var items = await query.Select(d => new GetAllDonUngTuyensViewModel
            {
                Id = d.Id,
                HoSoUngVienId = d.CVUngVien.HoSoUngVienId,
                TinTuyenDungId = d.TinTuyenDungId,
                CVUngVienId = d.CVUngVienId,
                TrangThai = d.TrangThai,
                GhiChu = d.GhiChu
            }).ToListAsync(cancellationToken);

            return new Response<List<GetAllDonUngTuyensViewModel>>(items);
        }
    }
}
