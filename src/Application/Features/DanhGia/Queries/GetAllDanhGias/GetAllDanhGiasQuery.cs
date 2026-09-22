using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
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
    IMapper mapper)
    : IRequestHandler<GetAllDanhGiasQuery, Response<List<GetAllDanhGiasViewModel>>>
{
    public async Task<Response<List<GetAllDanhGiasViewModel>>> Handle(
        GetAllDanhGiasQuery request,
        CancellationToken cancellationToken)
    {
        var query = context.DanhGias.AsNoTracking();

        if (request.DonUngTuyenId.HasValue)
        {
            query = query.Where(x => x.DonUngTuyenId == request.DonUngTuyenId.Value);
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
            .OrderByDescending(x => x.NgayPhanHoi)
            .ToListAsync(cancellationToken);

        return new Response<List<GetAllDanhGiasViewModel>>(
            mapper.Map<List<GetAllDanhGiasViewModel>>(items));
    }
}
