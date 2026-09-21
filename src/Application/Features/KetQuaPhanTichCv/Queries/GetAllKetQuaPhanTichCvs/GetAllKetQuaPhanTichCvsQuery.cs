using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.KetQuaPhanTichCv.Queries.GetAllKetQuaPhanTichCvs;

public class GetAllKetQuaPhanTichCvsQuery : IRequest<Response<List<GetAllKetQuaPhanTichCvsViewModel>>>
{
    public int _start { get; set; }
    public int _end { get; set; }
    public string _order { get; set; }
    public string _sort { get; set; }
    public string _filter { get; set; }
    public int? CVUngVienId { get; set; }
}

    public class GetAllKetQuaPhanTichCvsQueryHandler(
        IApplicationDbContext context,
        IMapper mapper,
        ICurrentNguoiDungService current)
        : IRequestHandler<GetAllKetQuaPhanTichCvsQuery, Response<List<GetAllKetQuaPhanTichCvsViewModel>>>
    {
        public async Task<Response<List<GetAllKetQuaPhanTichCvsViewModel>>> Handle(
            GetAllKetQuaPhanTichCvsQuery request,
            CancellationToken cancellationToken)
        {
            var ctx = await current.ResolveAsync();

            var query = context.KetQuaPhanTichCvs.AsNoTracking();

            // Ứng viên chỉ thấy phân tích CV của chính mình.
            if (ctx.VaiTro == VaiTroNguoiDung.UNG_VIEN)
            {
                query = query.Where(x => x.CVUngVien.HoSoUngVien.NguoiDungId == ctx.Id);
            }
            // Nhân sự / Người đại diện chỉ thấy phân tích CV của ứng viên
            // đã nộp đơn vào tin trong phạm vi mình.
            else if (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU ||
                     ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
            {
                var cvIds = await context.DonUngTuyens
                    .AsNoTracking()
                    .Where(d => ctx.VaiTro == VaiTroNguoiDung.NHAN_SU
                        ? d.TinTuyenDung.NguoiDangTinId == ctx.Id
                        : d.TinTuyenDung.DoanhNghiepId == ctx.DoanhNghiepId)
                    .Select(d => d.CVUngVienId)
                    .Distinct()
                    .ToListAsync(cancellationToken);
                query = query.Where(x => cvIds.Contains(x.CVUngVienId));
            }

        if (request.CVUngVienId.HasValue)
        {
            query = query.Where(x => x.CVUngVienId == request.CVUngVienId.Value);
        }

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

        return new Response<List<GetAllKetQuaPhanTichCvsViewModel>>(
            mapper.Map<List<GetAllKetQuaPhanTichCvsViewModel>>(items));
    }
}