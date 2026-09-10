using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
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
    IMapper mapper)
    : IRequestHandler<GetAllDanhMucNghesQuery, Response<List<GetAllDanhMucNghesViewModel>>>
{
    public async Task<Response<List<GetAllDanhMucNghesViewModel>>> Handle(
        GetAllDanhMucNghesQuery request,
        CancellationToken cancellationToken)
    {
        var query = context.DanhMucNghes.AsNoTracking();

        var filter = request._filter?.Trim();

        if (!string.IsNullOrWhiteSpace(filter))
        {
            query = query.Where(x => x.TenNghe.Contains(filter));
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

        var items = await query
            .OrderBy(x => x.Id)
            .ToListAsync(cancellationToken);

        return new Response<List<GetAllDanhMucNghesViewModel>>(
            mapper.Map<List<GetAllDanhMucNghesViewModel>>(items));
    }
}
