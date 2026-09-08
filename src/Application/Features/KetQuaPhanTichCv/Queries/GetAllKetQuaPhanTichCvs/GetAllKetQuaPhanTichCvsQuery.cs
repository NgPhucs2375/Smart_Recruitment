using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.KetQuaPhanTichCv.Queries.GetAllKetQuaPhanTichCvs;

public class GetAllKetQuaPhanTichCvsQuery : IRequest<Response<List<GetAllKetQuaPhanTichCvsViewModel>>>
{
    public int _start { get; set; }
    public int _end { get; set; }
    public string _order { get; set; }
    public string _sort { get; set; }
    public string _filter { get; set; }
    public int? CVUngVienId { get; set; }
}

public class GetAllKetQuaPhanTichCvsQueryHandler(IApplicationDbContext context, IMapper mapper) 
    : IRequestHandler<GetAllKetQuaPhanTichCvsQuery, Response<List<GetAllKetQuaPhanTichCvsViewModel>>>
{
    public async Task<Response<List<GetAllKetQuaPhanTichCvsViewModel>>> Handle(GetAllKetQuaPhanTichCvsQuery request, CancellationToken cancellationToken)
    {
        var query = context.KetQuaPhanTichCvs.AsNoTracking();

        if (request.CVUngVienId.HasValue)
        {
            query = query.Where(x => x.CVUngVienId == request.CVUngVienId.Value);
        }

        var take = request._end - request._start;
        if (take > 0)
        {
            query = query.Skip(request._start).Take(take);
        }



        return new Response<List<GetAllKetQuaPhanTichCvsViewModel>>(
            mapper.Map<List<GetAllKetQuaPhanTichCvsViewModel>>
            (await query.ToListAsync(cancellationToken))
        );
    }
}