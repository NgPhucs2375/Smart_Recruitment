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

    public class GetAllKetQuaPhuHopsQueryHandler(
        IApplicationDbContext context,
        IMapper mapper,
        ICurrentNguoiDungService current)
        : IRequestHandler<GetAllKetQuaPhuHopsQuery, Response<List<GetAllKetQuaPhuHopsViewModel>>>
    {
        public async Task<Response<List<GetAllKetQuaPhuHopsViewModel>>> Handle(
            GetAllKetQuaPhuHopsQuery request,
            CancellationToken cancellationToken)
        {
            var ctx = await current.ResolveAsync();

            var query = context.KetQuaPhuHops.AsNoTracking();

            // Ứng viên chỉ thấy kết quả của chính hồ sơ mình.
            if (ctx.VaiTro == VaiTroNguoiDung.UNG_VIEN)
            {
                var hoSoId = await context.HoSoUngViens
                    .AsNoTracking()
                    .Where(x => x.NguoiDungId == ctx.Id)
                    .Select(x => x.Id)
                    .FirstOrDefaultAsync(cancellationToken);
                query = query.Where(x => x.HoSoUngVienId == hoSoId);
            }
            // Nhân sự / Người đại diện chỉ thấy kết quả thuộc tin trong phạm vi mình.
            else if (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU)
            {
                query = query.Where(x => x.TinTuyenDung.NguoiDangTinId == ctx.Id);
            }
            else if (ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
            {
                query = query.Where(x => x.TinTuyenDung.DoanhNghiepId == ctx.DoanhNghiepId);
            }

            var filter = request._filter?.Trim();

            if (!string.IsNullOrWhiteSpace(filter))
            {
                if (int.TryParse(filter, out var idFilter))
                {
                    query = query.Where(x => x.HoSoUngVienId == idFilter || x.TinTuyenDungId == idFilter);
                }
                else if (Enum.TryParse<PhanLoaiKetQua>(filter, true, out var phanLoai))
                {
                    query = query.Where(x => x.PhanLoai == phanLoai);
                }
            }

            query = request._sort?.ToLower() switch
            {
                "diemphuhop" => request._order?.ToLower() == "desc" ? query.OrderByDescending(x => x.DiemPhuHop) : query.OrderBy(x => x.DiemPhuHop),
                "ngaydanhgia" => request._order?.ToLower() == "desc" ? query.OrderByDescending(x => x.Created) : query.OrderBy(x => x.Created),
                "phanloai" => request._order?.ToLower() == "desc" ? query.OrderByDescending(x => x.PhanLoai) : query.OrderBy(x => x.PhanLoai),
                _ => query.OrderBy(x => x.Id)
            };

            // Mặc định trang 20 bản ghi, tối đa 100: client không truyền
            // _start/_end hợp lệ không được quét toàn bảng.
            var skip = request._start < 0 ? 0 : request._start;
            var end = request._end <= skip ? skip + 20 : request._end;
            var take = end - skip;
            if (take > 100) take = 100;

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

            var result = mapper.Map<List<GetAllKetQuaPhuHopsViewModel>>(items);

            return new Response<List<GetAllKetQuaPhuHopsViewModel>>(result);
        }
    }
}
