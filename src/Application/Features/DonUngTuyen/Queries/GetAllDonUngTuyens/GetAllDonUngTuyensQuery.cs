using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace Application.Features.DonUngTuyen.Queries.GetAllDonUngTuyens;
public class GetAllDonUngTuyensQuery : IRequest<Response<List<GetAllDonUngTuyensViewModel>>> { public int _start { get; set; } public int _end { get; set; } public string _order { get; set; } public string _sort { get; set; } public string _filter { get; set; } public int? HoSoUngVienId { get; set; } public int? TinTuyenDungId { get; set; } }
public class GetAllDonUngTuyensQueryHandler(IApplicationDbContext context, IMapper mapper) : IRequestHandler<GetAllDonUngTuyensQuery, Response<List<GetAllDonUngTuyensViewModel>>>
{ public async Task<Response<List<GetAllDonUngTuyensViewModel>>> Handle(GetAllDonUngTuyensQuery request, CancellationToken cancellationToken) { var query = context.DonUngTuyens.AsNoTracking(); if (request.HoSoUngVienId.HasValue) query = query.Where(x => x.HoSoUngVienId == request.HoSoUngVienId.Value); if (request.TinTuyenDungId.HasValue) query = query.Where(x => x.TinTuyenDungId == request.TinTuyenDungId.Value); var take = request._end - request._start; if (take > 0) query = query.Skip(request._start).Take(take); return new Response<List<GetAllDonUngTuyensViewModel>>(mapper.Map<List<GetAllDonUngTuyensViewModel>>(await query.OrderByDescending(x => x.NgayUngTuyen).ToListAsync(cancellationToken))); } }
