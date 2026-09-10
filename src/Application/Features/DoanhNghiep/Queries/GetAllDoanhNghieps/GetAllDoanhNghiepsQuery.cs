using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace Application.Features.DoanhNghiep.Queries.GetAllDoanhNghieps;
public class GetAllDoanhNghiepsQuery : IRequest<Response<List<GetAllDoanhNghiepsViewModel>>> { public int _start { get; set; } public int _end { get; set; } public string _order { get; set; } public string _sort { get; set; } public string _filter { get; set; } }
public class GetAllDoanhNghiepsQueryHandler(IApplicationDbContext context, IMapper mapper) : IRequestHandler<GetAllDoanhNghiepsQuery, Response<List<GetAllDoanhNghiepsViewModel>>>
{
    public async Task<Response<List<GetAllDoanhNghiepsViewModel>>> Handle(GetAllDoanhNghiepsQuery request, CancellationToken cancellationToken)
    {
        var query = context.DoanhNghieps.AsNoTracking(); if (!string.IsNullOrWhiteSpace(request._filter)) query = query.Where(x => x.TenDoanhNghiep.Contains(request._filter));
        query = request._sort?.ToLower() switch
        {
            "tendoanhnghiep" when request._order?.ToLower() == "desc" => query.OrderByDescending(x => x.TenDoanhNghiep),
            "tendoanhnghiep" => query.OrderBy(x => x.TenDoanhNghiep),
            _ => query.OrderBy(x => x.Id)
        };
        var take = request._end - request._start; if (take > 0) query = query.Skip(request._start).Take(take);
        return new Response<List<GetAllDoanhNghiepsViewModel>>(mapper.Map<List<GetAllDoanhNghiepsViewModel>>(await query.ToListAsync(cancellationToken)));
    }
}
