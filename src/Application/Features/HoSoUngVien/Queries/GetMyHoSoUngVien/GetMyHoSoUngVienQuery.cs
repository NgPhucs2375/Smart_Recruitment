using Application.Features.HoSoUngVien.Queries.GetAllHoSoUngViens;
using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.HoSoUngVien.Queries.GetMyHoSoUngVien;

public class GetMyHoSoUngVienQuery : IRequest<Response<GetAllHoSoUngViensViewModel>> { }

public class GetMyHoSoUngVienQueryHandler(
    IApplicationDbContext context,
    IMapper mapper,
    ICurrentNguoiDungService current)
    : IRequestHandler<GetMyHoSoUngVienQuery, Response<GetAllHoSoUngViensViewModel>>
{
    public async Task<Response<GetAllHoSoUngViensViewModel>> Handle(GetMyHoSoUngVienQuery request, CancellationToken cancellationToken)
    {
        var ctx = await current.ResolveAsync();
        var entity = await context.HoSoUngViens
            .FirstOrDefaultAsync(x => x.NguoiDungId == ctx.Id, cancellationToken);
        if (entity == null)
            return new Response<GetAllHoSoUngViensViewModel>("Bạn chưa có hồ sơ ứng viên.");
        return new Response<GetAllHoSoUngViensViewModel>(mapper.Map<GetAllHoSoUngViensViewModel>(entity));
    }
}
