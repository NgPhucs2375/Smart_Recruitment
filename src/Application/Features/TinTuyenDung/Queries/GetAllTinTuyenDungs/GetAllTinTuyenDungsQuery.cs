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

    public class GetAllTinTuyenDungsQueryHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current)
        : IRequestHandler<GetAllTinTuyenDungsQuery, Response<List<GetAllTinTuyenDungsViewModel>>>
    {
        public async Task<Response<List<GetAllTinTuyenDungsViewModel>>> Handle(
            GetAllTinTuyenDungsQuery request,
            CancellationToken cancellationToken)
        {
            var ctx = await current.ResolveAsync();

            var query = context.TinTuyenDungs.AsNoTracking();

            if (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU)
            {
                query = query.Where(t => t.NguoiDangTinId == ctx.Id);
            }
            else if (ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
            {
                query = query.Where(t => t.DoanhNghiepId == ctx.DoanhNghiepId);
            }
            else // UNG_VIEN: chỉ tin công khai
            {
                query = query.Where(t => t.TrangThai == TrangThaiTinTuyenDung.DangTuyen);
            }

            var filter = request._filter?.Trim();

            if (!string.IsNullOrWhiteSpace(filter))
            {
                query = query.Where(t => t.TieuDe.Contains(filter));
            }

            query = request._sort?.ToLower() switch
            {
                "tieude" => request._order?.ToLower() == "desc"
                    ? query.OrderByDescending(t => t.TieuDe)
                    : query.OrderBy(t => t.TieuDe),
                _ => query.OrderByDescending(t => t.Id)
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

            var items = await query.Select(t => new GetAllTinTuyenDungsViewModel
            {
                Id = t.Id,
                DanhMucNgheId = t.DanhMucNgheId,
                TieuDe = t.TieuDe,
                MoTaCongViec = t.MoTaCongViec,
                KinhNghiemYeuCau = t.KinhNghiemYeuCau,
                YeuCauCongViec = t.YeuCauCongViec,
                QuyenLoi = t.QuyenLoi,
                DiaDiemLamViec = t.DiaDiemLamViec,
                LuongToiThieu = t.LuongToiThieu,
                LuongToiDa = t.LuongToiDa,
                TrangThai = t.TrangThai.ToString(),
                NgayHetHan = t.NgayHetHan,
                NguoiDangTinId = t.NguoiDangTinId,
                DoanhNghiepId = t.DoanhNghiepId
            }).ToListAsync(cancellationToken);

            return new Response<List<GetAllTinTuyenDungsViewModel>>(items);
        }
    }
}
