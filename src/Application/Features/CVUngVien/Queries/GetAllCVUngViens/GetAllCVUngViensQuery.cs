using Application.Interfaces;
using Application.Wrappers;
using Application.Features.CVUngVien.Cache;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

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
    ICurrentNguoiDungService currentNguoiDungService,
    IDistributedCache cache)
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
        var skip = Math.Max(0, request._start);
        var take = request._end > skip ? request._end - skip : 20;
        var filter = request._filter?.Trim() ?? string.Empty;
        var sort = request._sort ?? string.Empty;
        var order = request._order ?? string.Empty;
        var version = await cache.GetStringAsync(
            CVUngVienListCache.VersionKey(currentUser.Id),
            cancellationToken) ?? "1";
        var cacheKey = CVUngVienListCache.BuildKey(
            currentUser.Id,
            version,
            skip,
            request._end,
            filter,
            sort,
            order);

        var cached = await cache.GetStringAsync(cacheKey, cancellationToken);
        if (!string.IsNullOrWhiteSpace(cached))
        {
            var cachedResponse = JsonSerializer.Deserialize<
                Response<List<GetAllCVUngViensViewModel>>>(cached);

            if (cachedResponse != null)
                return cachedResponse;
        }

        var query = context.CVUngViens
            .AsNoTracking()
            .Where(x =>
                !x.IsDaXoa &&
                x.HoSoUngVien.NguoiDungId ==
                    currentUser.Id);

        if (!string.IsNullOrWhiteSpace(filter))
        {
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

        var response = new Response<
            List<GetAllCVUngViensViewModel>>(
            data: items,
            message: "Lấy danh sách CV thành công.");

        await cache.SetStringAsync(
            cacheKey,
            JsonSerializer.Serialize(response),
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1),
                SlidingExpiration = TimeSpan.FromSeconds(30)
            },
            cancellationToken);

        return response;
    }
}
