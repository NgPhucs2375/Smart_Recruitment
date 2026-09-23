using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CvTheme.Queries.GetAllCvThemes;

public class GetAllCvThemesQuery : IRequest<Response<List<GetAllCvThemesViewModel>>>
{
    public int _start { get; set; }
    public int _end { get; set; }
    public string _order { get; set; }
    public string _sort { get; set; }
    public string _filter { get; set; }
    public bool? ChiHienThi { get; set; }
}

public class GetAllCvThemesQueryHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<GetAllCvThemesQuery, Response<List<GetAllCvThemesViewModel>>>
{
    public async Task<Response<List<GetAllCvThemesViewModel>>> Handle(
        GetAllCvThemesQuery request,
        CancellationToken cancellationToken)
    {
        var query = context.CvThemes.AsNoTracking();

        var filter = request._filter?.Trim();

        if (!string.IsNullOrWhiteSpace(filter))
        {
            query = query.Where(x =>
                x.Ten.Contains(filter) ||
                x.Slug.Contains(filter) ||
                (x.Tags != null && x.Tags.Contains(filter)));
        }

        if (request.ChiHienThi.HasValue)
        {
            query = query.Where(x => x.IsActive == request.ChiHienThi.Value);
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
            .OrderBy(x => x.ThuTu)
            .ThenBy(x => x.Id)
            .ToListAsync(cancellationToken);

        return new Response<List<GetAllCvThemesViewModel>>(
            mapper.Map<List<GetAllCvThemesViewModel>>(items));
    }
}
