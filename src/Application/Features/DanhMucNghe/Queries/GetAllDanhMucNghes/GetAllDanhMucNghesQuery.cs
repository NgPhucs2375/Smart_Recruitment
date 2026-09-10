using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace Application.Features.DanhMucNghe.Queries.GetAllDanhMucNghes;
public class GetAllDanhMucNghesQuery : IRequest<Response<List<GetAllDanhMucNghesViewModel>>> { 
    public int _start { get; set; } 
    public int _end { get; set; } 
    public string _order { get; set; } 
    public string _sort { get; set; }
    public string _filter { get; set; }
}
public class GetAllDanhMucNghesQueryHandler(IApplicationDbContext context, IMapper mapper) : IRequestHandler<GetAllDanhMucNghesQuery, Response<List<GetAllDanhMucNghesViewModel>>>
{
    public async Task<Response<List<GetAllDanhMucNghesViewModel>>> Handle(GetAllDanhMucNghesQuery request, CancellationToken cancellationToken)
    {
        var query = context.DanhMucNghes.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(request._filter))
            query = query.Where(x => x.TenNghe.Contains(request._filter));
        var take = request._end - request._start;
        if (take > 0) query = query.Skip(request._start).Take(take);
        return new Response<List<GetAllDanhMucNghesViewModel>>(mapper.Map<List<GetAllDanhMucNghesViewModel>>(await query.OrderBy(x => x.Id).ToListAsync(cancellationToken)));
    }
}
