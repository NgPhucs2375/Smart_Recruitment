using Application.Features.CvTheme.Queries.GetAllCvThemes;
using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using MediatR;

namespace Application.Features.CvTheme.Queries.GetCvThemeById;

public class GetCvThemeByIdQuery : IRequest<Response<GetAllCvThemesViewModel>>
{
    public int Id { get; set; }
}

public class GetCvThemeByIdQueryHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<GetCvThemeByIdQuery, Response<GetAllCvThemesViewModel>>
{
    public async Task<Response<GetAllCvThemesViewModel>> Handle(
        GetCvThemeByIdQuery request,
        CancellationToken cancellationToken)
    {
        var entity = await context.CvThemes
            .FindAsync([request.Id], cancellationToken);

        if (entity == null)
        {
            return new Response<GetAllCvThemesViewModel>(
                "Không tìm thấy theme CV.");
        }

        return new Response<GetAllCvThemesViewModel>(
            mapper.Map<GetAllCvThemesViewModel>(entity));
    }
}
