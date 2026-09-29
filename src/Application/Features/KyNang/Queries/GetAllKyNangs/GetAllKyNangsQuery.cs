using Application.Interfaces;
using Application.Wrappers;
using Application.Features.KyNang.Cache;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KyNang.Queries.GetAllKyNangs
{
    public class GetAllKyNangsQuery : IRequest<Response<List<GetAllKyNangsViewModel>>>
    {
        public int _start { get; set; }
        public int _end { get; set; }
        public string _order { get; set; }
        public string _sort { get; set; }
        public string _filter { get; set; }
    }

    public class GetAllKyNangsQueryHandler(
        IApplicationDbContext context,
        IMapper mapper,
        IDistributedCache cache)
        : IRequestHandler<GetAllKyNangsQuery, Response<List<GetAllKyNangsViewModel>>>
    {
        public async Task<Response<List<GetAllKyNangsViewModel>>> Handle(
            GetAllKyNangsQuery request,
            CancellationToken cancellationToken)
        {
            var filter = request._filter?.Trim();
            var skip = request._start < 0 ? 0 : request._start;
            var take = request._end - skip;

            var version = await cache.GetStringAsync(
                KyNangCache.VersionKey,
                cancellationToken) ?? "1";
            var cacheKey = KyNangCache.BuildKey(
                version,
                skip,
                request._end,
                filter,
                request._sort,
                request._order);

            var cached = await cache.GetStringAsync(cacheKey, cancellationToken);
            if (!string.IsNullOrWhiteSpace(cached))
            {
                var cachedResponse = JsonSerializer.Deserialize<
                    Response<List<GetAllKyNangsViewModel>>>(cached);

                if (cachedResponse != null)
                    return cachedResponse;
            }

            var query = context.KyNangs.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(filter))
            {
                query = query.Where(x => x.TenKyNang.Contains(filter));
            }

            query = request._sort?.ToLower() switch
            {
                "tenkynang" => request._order?.ToLower() == "desc"
                    ? query.OrderByDescending(x => x.TenKyNang)
                    : query.OrderBy(x => x.TenKyNang),
                _ => query.OrderBy(x => x.Id)
            };

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

            var result = mapper.Map<List<GetAllKyNangsViewModel>>(items);

            var response = new Response<List<GetAllKyNangsViewModel>>(result);

            await cache.SetStringAsync(
                cacheKey,
                JsonSerializer.Serialize(response),
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15),
                    SlidingExpiration = TimeSpan.FromMinutes(5)
                },
                cancellationToken);

            return response;
        }
    }
}
