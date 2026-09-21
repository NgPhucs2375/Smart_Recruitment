using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.HoSoUngVien.Queries.GetAllHoSoUngViens
{
    public class GetAllHoSoUngViensQuery : IRequest<Response<List<GetAllHoSoUngViensViewModel>>>
    {
        public int _start { get; set; }
        public int _end { get; set; }
        public string _order { get; set; }
        public string _sort { get; set; }
        public string _filter { get; set; }
    }

    public class GetAllHoSoUngViensQueryHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current,
        IMapper mapper)
        : IRequestHandler<GetAllHoSoUngViensQuery, Response<List<GetAllHoSoUngViensViewModel>>>
    {
        public async Task<Response<List<GetAllHoSoUngViensViewModel>>> Handle(
            GetAllHoSoUngViensQuery request,
            CancellationToken cancellationToken)
        {
            var ctx = await current.ResolveAsync();

            var query = context.HoSoUngViens.AsNoTracking();

            // Scope theo vai trò — hồ sơ ứng viên chỉ hiện cho bên liên quan:
            // - QUAN_TRI_VIEN: xem tất cả.
            // - NGUOI_DAI_DIEN / NHAN_SU: chỉ ứng viên đã ứng tuyển vào tin
            //   của doanh nghiệp mình (không thấy ứng viên của DN khác).
            // - UNG_VIEN: chỉ hồ sơ của chính mình.
            if (ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN || ctx.VaiTro == VaiTroNguoiDung.NHAN_SU)
            {
                query = query.Where(x => x.CVUngViens.Any(cv =>
                    context.DonUngTuyens.Any(d =>
                        d.CVUngVienId == cv.Id &&
                        d.TinTuyenDung.DoanhNghiepId == ctx.DoanhNghiepId)));
            }
            else if (ctx.VaiTro == VaiTroNguoiDung.UNG_VIEN)
            {
                query = query.Where(x => x.NguoiDungId == ctx.Id);
            }

            var filter = request._filter?.Trim();

            if (!string.IsNullOrWhiteSpace(filter))
            {
                query = query.Where(x => x.HoTen.Contains(filter));
            }

            query = request._sort?.ToLower() switch
            {
                "hoten" => request._order?.ToLower() == "desc"
                    ? query.OrderByDescending(x => x.HoTen)
                    : query.OrderBy(x => x.HoTen),
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

            var items = await query.ToListAsync(
                cancellationToken);

            var result = mapper.Map<List<GetAllHoSoUngViensViewModel>>(items);

            return new Response<List<GetAllHoSoUngViensViewModel>>(result);
        }
    }
}
