using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CVUngVien.Queries.GetAllCVUngViens;

public class GetAllCVUngViensQuery
    : IRequest<Response<List<GetAllCVUngViensViewModel>>>
{
    public int _start { get; set; }

    public int _end { get; set; }

    public string? _order { get; set; }

    public string? _sort { get; set; }

    public string? _filter { get; set; }
}

public class GetAllCVUngViensQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService currentNguoiDungService)
    : IRequestHandler<
        GetAllCVUngViensQuery,
        Response<List<GetAllCVUngViensViewModel>>>
{
    public async Task<Response<List<GetAllCVUngViensViewModel>>> Handle(
        GetAllCVUngViensQuery request,
        CancellationToken cancellationToken)
    {

        var currentUser =
            await currentNguoiDungService.ResolveAsync();
        var query = context.CVUngViens
            .AsNoTracking()
            .Where(x =>
                !x.IsDaXoa &&
                x.HoSoUngVien.NguoiDungId ==
                    currentUser.Id);

        if (!string.IsNullOrWhiteSpace(request._filter))
        {
            var filter = request._filter.Trim();

            query = query.Where(x =>
                x.TenFile.Contains(filter) ||
                (
                    x.ThongTinLienHe != null &&
                    (
                        x.ThongTinLienHe.HoTen.Contains(filter) ||
                        (
                            x.ThongTinLienHe.ViTriUngTuyen != null &&
                            x.ThongTinLienHe.ViTriUngTuyen.Contains(filter)
                        )
                    )
                ));
        }

        query = (
            request._sort?.ToLowerInvariant(),
            request._order?.ToLowerInvariant())
            switch
            {
                ("tenfile", "asc")
                    => query.OrderBy(x => x.TenFile),

                ("tenfile", _)
                    => query.OrderByDescending(x => x.TenFile),
                _
                    => query.OrderByDescending(x => x.Created)
            };

        var skip = Math.Max(
            0,
            request._start);

        var take =
            request._end > skip
                ? request._end - skip
                : 20;

        var items = await query
            .Skip(skip)
            .Take(take)
            .Select(x =>
                new GetAllCVUngViensViewModel
                {
                    Id = x.Id,

                    HoSoUngVienId =
                        x.HoSoUngVienId,

                    TenFile =
                        x.TenFile,

                    FileUrl =
                        x.FileUrl,

                    IsDefault =
                        x.IsDefault,

                    TemplateId =
                        x.TemplateId,

                    PhuongThucTao =
                        x.PhuongThucTao,

                    HoTen =
                        x.ThongTinLienHe != null
                            ? x.ThongTinLienHe.HoTen
                            : null,

                    ViTriUngTuyen =
                        x.ThongTinLienHe != null
                            ? x.ThongTinLienHe.ViTriUngTuyen
                            : null
                })
            .ToListAsync(cancellationToken);

        return new Response<
            List<GetAllCVUngViensViewModel>>(
            data: items,
            message: "Lấy danh sách CV thành công.");
    }
}
