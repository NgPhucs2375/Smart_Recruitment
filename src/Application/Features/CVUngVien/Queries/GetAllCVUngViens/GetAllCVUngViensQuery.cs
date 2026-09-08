using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CVUngVien.Queries.GetAllCVUngViens;

public class GetAllCVUngViensQuery : IRequest<Response<List<GetAllCVUngViensViewModel>>> { public int _start { get; set; } public int _end { get; set; } public string _order { get; set; } public string _sort { get; set; } public string _filter { get; set; } public int? HoSoUngVienId { get; set; } }
public class GetAllCVUngViensQueryHandler(IApplicationDbContext context, IMapper mapper) : IRequestHandler<GetAllCVUngViensQuery, Response<List<GetAllCVUngViensViewModel>>>
{
    public async Task<Response<List<GetAllCVUngViensViewModel>>> Handle(GetAllCVUngViensQuery request, CancellationToken cancellationToken)
    {
        var query = context.CVUngViens.AsNoTracking(); if (request.HoSoUngVienId.HasValue) query = query.Where(x => x.HoSoUngVienId == request.HoSoUngVienId.Value);
        var take = request._end - request._start; if (take > 0) query = query.Skip(request._start).Take(take);
        return new Response<List<GetAllCVUngViensViewModel>>(mapper.Map<List<GetAllCVUngViensViewModel>>(await query.OrderByDescending(x => x.NgayUpload).ToListAsync(cancellationToken)));
    }
}
