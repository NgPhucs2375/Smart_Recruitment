using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Application.Features.DanhMucNghe.Cache;
namespace Application.Features.DanhMucNghe.Queries.GetAllDanhMucNghes;
public class GetAllDanhMucNghesQuery : IRequest<Response<List<GetAllDanhMucNghesViewModel>>>
{
    public int _start { get; set; }

    public int _end { get; set; }

    public string _order { get; set; }

    public string _sort { get; set; }

    public string _filter { get; set; }
}

public class GetAllDanhMucNghesQueryHandler(
    IApplicationDbContext context,
    IMapper mapper,
    IDistributedCache cache
    )
    : IRequestHandler<GetAllDanhMucNghesQuery, Response<List<GetAllDanhMucNghesViewModel>>>
{
    public async Task<Response<List<GetAllDanhMucNghesViewModel>>> Handle(
        GetAllDanhMucNghesQuery request,
        CancellationToken cancellationToken)
    {

        var skip = request._start < 0 ? 0 : request._start;
        var take = request._end - skip;
        var filter = request._filter?.Trim() ?? string.Empty;
        var query = context.DanhMucNghes.AsNoTracking();

        var version =
            await cache.GetStringAsync(
                DanhMucNgheCache.VersionKey,
                cancellationToken
            ) ?? "1";

        var cacheKey = DanhMucNgheCache.BuildKey(
            version,
            skip,
            request._end,
            filter
        );

        var cached = await cache.GetStringAsync(
            cacheKey,
            cancellationToken
        );

        if (!string.IsNullOrWhiteSpace(cached))
        {
            var cachedResponse =
                JsonSerializer.Deserialize<
                    Response<List<GetAllDanhMucNghesViewModel>>>(
                        cached
                    );

            if(cachedResponse != null) return cachedResponse;
        }

        if (!string.IsNullOrWhiteSpace(filter))
        {
            query = query.Where(x =>
                x.TenNghe.Contains(filter));
        }

        if (skip > 0)
        {
            query = query.Skip(skip);
        }

        if (take > 0)
        {
            query = query.Take(take);
        }

        var items = await query
            .OrderBy(x => x.Id)
            .ToListAsync(cancellationToken);

        var response = new Response<List<GetAllDanhMucNghesViewModel>>(
            mapper.Map<List<GetAllDanhMucNghesViewModel>>(items)
        );

        await cache.SetStringAsync(
            cacheKey,
            JsonSerializer.Serialize(response),
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15),
                SlidingExpiration = TimeSpan.FromMinutes(5)
            },
            cancellationToken
        );

        return response;
    }
}
