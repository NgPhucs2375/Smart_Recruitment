using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CVUngVien.Queries.GetAllCVUngViens;

public class GetAllCVUngViensQuery : IRequest<Response<List<GetAllCVUngViensViewModel>>>
{
    public int _start { get; set; }

    public int _end { get; set; }

    public string _order { get; set; }

    public string _sort { get; set; }

    public string _filter { get; set; }

    public int? HoSoUngVienId { get; set; }
}

public class GetAllCVUngViensQueryHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<GetAllCVUngViensQuery, Response<List<GetAllCVUngViensViewModel>>>
{
    public async Task<Response<List<GetAllCVUngViensViewModel>>> Handle(
        GetAllCVUngViensQuery request,
        CancellationToken cancellationToken)
    {
        var query = context.CVUngViens
            .AsNoTracking()
            .Where(x => !x.IsDaXoa);

        if (request.HoSoUngVienId.HasValue)
        {
            query = query.Where(x => x.HoSoUngVienId == request.HoSoUngVienId.Value);
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
            .OrderByDescending(x => x.NgayUpload)
            .ToListAsync(cancellationToken);

        return new Response<List<GetAllCVUngViensViewModel>>(
            mapper.Map<List<GetAllCVUngViensViewModel>>(items));
    }
}
