using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KyNangUngVien.Queries.GetAllKyNangUngViens
{
    public class GetAllKyNangUngViensQuery : IRequest<Response<List<GetAllKyNangUngViensViewModel>>>
    {
        public int _start { get; set; }

        public int _end { get; set; }

        public string _order { get; set; }

        public string _sort { get; set; }

        public string _filter { get; set; }

        public int? HoSoUngVienId { get; set; }
    }

    public class GetAllKyNangUngViensQueryHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current)
        : IRequestHandler<GetAllKyNangUngViensQuery, Response<List<GetAllKyNangUngViensViewModel>>>
    {
        public async Task<Response<List<GetAllKyNangUngViensViewModel>>> Handle(
            GetAllKyNangUngViensQuery request,
            CancellationToken cancellationToken)
        {
            var ctx = await current.ResolveAsync();

            var query = context.KyNangUngViens.AsNoTracking();

            // Ứng viên chỉ thấy kỹ năng của chính hồ sơ mình.
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
                query = query.Where(x => x.KyNang.TenKyNang.Contains(filter));
            }

            query = request._sort?.ToLower() switch
            {
                "tenkynang" => request._order?.ToLower() == "desc"
                    ? query.OrderByDescending(x => x.KyNang.TenKyNang)
                    : query.OrderBy(x => x.KyNang.TenKyNang),
                _ => query.OrderBy(x => x.Id)
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
                .Select(x => new GetAllKyNangUngViensViewModel
                {
                    Id = x.Id,
                    HoSoUngVienId = x.HoSoUngVienId,
                    KyNangId = x.KyNangId,
                    TenKyNang = x.KyNang.TenKyNang,
                    SoNamKinhNghiem = x.SoNamKinhNghiem
                })
                .ToListAsync(cancellationToken);

            return new Response<List<GetAllKyNangUngViensViewModel>>(items);
        }
    }
}
