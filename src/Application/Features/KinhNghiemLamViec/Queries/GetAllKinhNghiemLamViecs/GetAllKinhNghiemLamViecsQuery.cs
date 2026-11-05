using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using KinhNghiemLamViecEntity = global::KinhNghiemLamViec;

namespace Application.Features.KinhNghiemLamViec.Queries.GetAllKinhNghiemLamViecs
{
    public class GetAllKinhNghiemLamViecsQuery : IRequest<Response<List<GetAllKinhNghiemLamViecsViewModel>>>
    {
        public int _start { get; set; }

        public int _end { get; set; }

        public string _order { get; set; }

        public string _sort { get; set; }

        public string _filter { get; set; }

        public int? HoSoUngVienId { get; set; }
    }

    public class GetAllKinhNghiemLamViecsQueryHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current)
        : IRequestHandler<GetAllKinhNghiemLamViecsQuery, Response<List<GetAllKinhNghiemLamViecsViewModel>>>
    {
        public async Task<Response<List<GetAllKinhNghiemLamViecsViewModel>>> Handle(
            GetAllKinhNghiemLamViecsQuery request,
            CancellationToken cancellationToken)
        {
            var ctx = await current.ResolveAsync();

            var query = context.KinhNghiemLamViecs.AsNoTracking();

            // Ứng viên chỉ thấy kinh nghiệm của chính hồ sơ mình.
            if (ctx.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN)
            {
                var hoSoId = await context.HoSoUngViens
                    .AsNoTracking()
                    .Where(x => x.NguoiDungId == ctx.Id)
                    .Select(x => x.Id)
                    .FirstOrDefaultAsync(cancellationToken);
                query = query.Where(x => x.HoSoUngVienId == hoSoId);
            }
            else if (request.HoSoUngVienId.HasValue)
            {
                query = query.Where(x => x.HoSoUngVienId == request.HoSoUngVienId.Value);
            }

            var filter = request._filter?.Trim();

            if (!string.IsNullOrWhiteSpace(filter))
            {
                query = query.Where(x => x.TenCongTy.Contains(filter));
            }

            query = request._sort?.ToLower() switch
            {
                "tencongty" => request._order?.ToLower() == "desc"
                    ? query.OrderByDescending(x => x.TenCongTy)
                    : query.OrderBy(x => x.TenCongTy),
                "tungay" => request._order?.ToLower() == "desc"
                    ? query.OrderByDescending(x => x.TuNgay)
                    : query.OrderBy(x => x.TuNgay),
                _ => query.OrderByDescending(x => x.Id)
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

            var items = await query
                .Select(x => new GetAllKinhNghiemLamViecsViewModel
                {
                    Id = x.Id,
                    HoSoUngVienId = x.HoSoUngVienId,
                    TenCongTy = x.TenCongTy,
                    DiaChi = x.DiaChi,
                    TuNgay = x.TuNgay,
                    DenNgay = x.DenNgay,
                    MoTa = x.MoTa,
                    IsHienTai = x.IsHienTai
                })
                .ToListAsync(cancellationToken);

            return new Response<List<GetAllKinhNghiemLamViecsViewModel>>(items);
        }
    }
}
