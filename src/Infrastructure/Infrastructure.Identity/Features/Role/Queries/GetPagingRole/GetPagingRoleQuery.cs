using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using MediatR;
using Application.Wrappers;
using Infrastructure.Identity.Contexts;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Shared.Extensions;

namespace Infrastructure.Identity.Features.Role.Queries.GetPagingRole
{
    public class GetPagingRoleQuery : IRequest<Response<object>>
    {
        public List<string> id { get; set; }
        public int _start { get; set; }
        public int _end { get; set; }
        public string _sort { get; set; }
        public string _order { get; set; }
        public List<string> _filter { get; set; }

        public class GetPagingUserHanlder : IRequestHandler<GetPagingRoleQuery, Response<object>>
        {
            private readonly IMapper _mapper;
            private readonly IdentityContext _context;
            public GetPagingUserHanlder(
                IMapper mapper,
                IdentityContext context
            )
            {
                _mapper = mapper;
                _context = context;
            }

            public async Task<Response<object>> Handle(GetPagingRoleQuery request, CancellationToken cancellationToken)
            {
                if (request.id != null && request.id.Count > 0)
                {
                    // Chỉ trả Id/Name — không lọt field nội bộ của IdentityRole.
                    var roleIds = await _context.Roles
                        .AsNoTracking()
                        .Where(x => request.id.Contains(x.Id))
                        .Select(x => new { x.Id, x.Name })
                        .ToListAsync();
                    return new Response<object>(true, roleIds, message: "Success");
                }

                var roleQuery = _context.Roles
                    .AsQueryable();
                if (request._filter != null && request._filter.Count > 0)
                {
                    roleQuery = MethodExtensions.ApplyFilters(roleQuery, request._filter);
                }

                var roles = await PagedList<IdentityRole>.ToPagedList(roleQuery.OrderByDynamic(request._sort, request._order).AsNoTracking(), request._start, request._end);
                // Project sau paging (giữ nguyên sort/filter trên entity): chỉ trả Id/Name.
                var projected = new PagedList<object>(roles.Select(r => new { r.Id, r.Name }).ToList<object>(), roles._total, roles._start, roles._end);
                return new Response<object>(true, new
                {
                    projected._start,
                    projected._end,
                    projected._total,
                    projected._hasNext,
                    projected._hasPrevious,
                    projected._pages,
                    _data = projected
                }, message: "Success");
            }
        }
    }
}
