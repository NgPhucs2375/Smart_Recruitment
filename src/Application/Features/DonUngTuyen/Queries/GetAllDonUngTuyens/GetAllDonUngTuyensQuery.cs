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
    public class GetAllDonUngTuyensQuery : IRequest<PagedResponse<List<GetAllDonUngTuyensViewModel>>>
    {
        public int _start { get; set; }
        public int _end { get; set; }
        public string _order { get; set; }
        public string _sort { get; set; }
        public string _filter { get; set; }
        public int? HoSoUngVienId { get; set; }
        public int? CVUngVienId { get; set; }
        public int? TinTuyenDungId { get; set; }
        public int? TrangThai { get; set; }
    }

    public class GetAllDonUngTuyensQueryHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current)
        : IRequestHandler<GetAllDonUngTuyensQuery, PagedResponse<List<GetAllDonUngTuyensViewModel>>>
    {
        public async Task<PagedResponse<List<GetAllDonUngTuyensViewModel>>> Handle(
            GetAllDonUngTuyensQuery request,
            CancellationToken cancellationToken)
        {
            var ctx = await current.ResolveAsync();

            var query = context.DonUngTuyens.AsNoTracking();

            // QUAN_TRI_VIEN: xem tất cả, không lọc thêm
            if (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU)
            {
                query = query.Where(d => d.TinTuyenDung.DoanhNghiepId == ctx.DoanhNghiepId);
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

            if (request.TrangThai.HasValue)
            {
                var st = (TrangThaiDonUngTuyen)request.TrangThai.Value;
                query = query.Where(x => x.TrangThai == st);
            }

            var filter = request._filter?.Trim();

            if (!string.IsNullOrWhiteSpace(filter))
            {
                query = query.Where(d =>
                    (d.GhiChu != null && d.GhiChu.Contains(filter))
                    || d.TinTuyenDung.TieuDe.Contains(filter)
                    || d.TinTuyenDung.DoanhNghiep.TenDoanhNghiep.Contains(filter));
            }

            query = request._sort?.ToLower() switch
            {
                "trangthai" => request._order?.ToLower() == "desc"
                    ? query.OrderByDescending(d => d.TrangThai)
                    : query.OrderBy(d => d.TrangThai),
                "ngayungtuyen" => request._order?.ToLower() == "desc"
                    ? query.OrderByDescending(d => d.NgayUngTuyen)
                    : query.OrderBy(d => d.NgayUngTuyen),
                _ => query.OrderByDescending(d => d.Id)
            };

            var start = request._start < 0 ? 0 : request._start;
            var end = request._end <= start ? start + 20 : request._end;
            var pageSize = end - start;
            if (pageSize < 1) pageSize = 20;
            if (pageSize > 100) pageSize = 100;
            var pageNumber = (start / pageSize) + 1;
            if (pageNumber < 1) pageNumber = 1;

            var pagedList = await PagedList<GetAllDonUngTuyensViewModel>.ToPagedListByPage(
                query.Select(d => new GetAllDonUngTuyensViewModel
                {
                    Id = d.Id,
                    HoSoUngVienId = d.CVUngVien.HoSoUngVienId,
                    TinTuyenDungId = d.TinTuyenDungId,
                    CVUngVienId = d.CVUngVienId,
                    CVPhienBanId = d.CVPhienBanId,
                    TrangThai = d.TrangThai,
                    GhiChu = d.GhiChu,
                    NgayUngTuyen = d.NgayUngTuyen,
                    TieuDe = d.TinTuyenDung.TieuDe,
                    TenDoanhNghiep = d.TinTuyenDung.DoanhNghiep.TenDoanhNghiep,
                    DiaDiemLamViec = d.TinTuyenDung.DiaDiemLamViec,
                    LuongToiThieu = d.TinTuyenDung.LuongToiThieu,
                    LuongToiDa = d.TinTuyenDung.LuongToiDa
                }), pageNumber, pageSize, cancellationToken);

            return new PagedResponse<List<GetAllDonUngTuyensViewModel>>(
                pagedList.ToList(),
                pagedList.PageNumber,
                pagedList.PageSize,
                pagedList.TotalCount,
                pagedList.TotalPages);
        }
    }
}
