using Application.Features.CvTheme.Queries.GetAllCvThemes;
using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CvTheme.Queries.GetActiveCvThemes;

/// <summary>
/// Danh sách theme đang bật cho gallery public + AI gợi ý.
/// Không yêu cầu đăng nhập (controller gắn AllowAnonymous).
/// </summary>
public class GetActiveCvThemesQuery : IRequest<Response<List<GetAllCvThemesViewModel>>>
{
}

public class GetActiveCvThemesQueryHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<GetActiveCvThemesQuery, Response<List<GetAllCvThemesViewModel>>>
{
    public async Task<Response<List<GetAllCvThemesViewModel>>> Handle(
        GetActiveCvThemesQuery request,
        CancellationToken cancellationToken)
    {
        var items = await context.CvThemes
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.ThuTu)
            .ThenBy(x => x.Id)
            .ToListAsync(cancellationToken);

        return new Response<List<GetAllCvThemesViewModel>>(
            mapper.Map<List<GetAllCvThemesViewModel>>(items));
    }
}
