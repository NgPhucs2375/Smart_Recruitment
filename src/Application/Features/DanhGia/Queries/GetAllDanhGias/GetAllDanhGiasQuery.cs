using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.DanhGia.Queries.GetAllDanhGias;

public class GetAllDanhGiasQuery : IRequest<Response<List<GetAllDanhGiasViewModel>>>
{
    public int _start { get; set; }

    public int _end { get; set; }

    public string _order { get; set; }

    public string _sort { get; set; }

    public string _filter { get; set; }

    public int? DonUngTuyenId { get; set; }
}

    public class GetAllDanhGiasQueryHandler(
        IApplicationDbContext context,
        IMapper mapper,
        ICurrentNguoiDungService current)
        : IRequestHandler<GetAllDanhGiasQuery, Response<List<GetAllDanhGiasViewModel>>>
    {
        public async Task<Response<List<GetAllDanhGiasViewModel>>> Handle(
            GetAllDanhGiasQuery request,
            CancellationToken cancellationToken)
        {
            var ctx = await current.ResolveAsync();

            // Nhân sự / Người đại diện chỉ được xem đánh giá theo từng đơn
            // thuộc phạm vi mình phụ trách (chống quét toàn bộ).
            if (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU ||
                ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
            {
                if (!request.DonUngTuyenId.HasValue)
                {
                    return new Response<List<GetAllDanhGiasViewModel>>(
                        new List<GetAllDanhGiasViewModel>());
                }

                var trongPhamVi = await context.DonUngTuyens
                    .AsNoTracking()
                    .AnyAsync(
                        d =>
                            d.Id == request.DonUngTuyenId.Value &&
                            (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU
                                ? d.TinTuyenDung.NguoiDangTinId == ctx.Id
                                : d.TinTuyenDung.DoanhNghiepId == ctx.DoanhNghiepId),
                        cancellationToken);

                if (!trongPhamVi)
                {
                    return new Response<List<GetAllDanhGiasViewModel>>(
                        new List<GetAllDanhGiasViewModel>());
                }
            }

            var query = Application.Security.ResourceAccess.ScopeReviews(context.DanhGias.AsNoTracking(), ctx);

        if (request.DonUngTuyenId.HasValue)
        {
            query = query.Where(x => x.DonUngTuyenId == request.DonUngTuyenId.Value);
        }

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

        var items = await query
            .OrderByDescending(x => x.NgayPhanHoi)
            .ToListAsync(cancellationToken);

        return new Response<List<GetAllDanhGiasViewModel>>(
            mapper.Map<List<GetAllDanhGiasViewModel>>(items));
    }
}
