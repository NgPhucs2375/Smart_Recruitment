using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CVUngVien.Queries.GetCvVersions;

public class GetCvVersionsQuery : IRequest<Response<List<CvVersionViewModel>>>
{
    public int CVUngVienId { get; set; }
}

public class CvVersionViewModel
{
    public int Id { get; set; }
    public int SoPhienBan { get; set; }
    public string TenFile { get; set; }
    public string? TemplateId { get; set; }
    public DateTime Created { get; set; }
    public bool HasOriginal { get; set; }
}

public class GetCvVersionsQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService currentNguoiDungService)
    : IRequestHandler<GetCvVersionsQuery, Response<List<CvVersionViewModel>>>
{
    public async Task<Response<List<CvVersionViewModel>>> Handle(
        GetCvVersionsQuery request,
        CancellationToken cancellationToken)
    {
        var currentUser = await currentNguoiDungService.ResolveAsync();
        var ownsCv = await context.CVUngViens.AsNoTracking().AnyAsync(
            x => x.Id == request.CVUngVienId && !x.IsDaXoa &&
                 (currentUser.VaiTro == Domain.Enums.VaiTroNguoiDung.QUAN_TRI_VIEN ||
                  x.HoSoUngVien.NguoiDungId == currentUser.Id),
            cancellationToken);
        if (!ownsCv)
            return new Response<List<CvVersionViewModel>>("Không tìm thấy CV.");

        var versions = await context.CVPhienBans.AsNoTracking()
            .Where(x => x.CVUngVienId == request.CVUngVienId)
            .OrderByDescending(x => x.SoPhienBan)
            .Select(x => new CvVersionViewModel
            {
                Id = x.Id,
                SoPhienBan = x.SoPhienBan,
                TenFile = x.TepDaSinh.TenFile,
                TemplateId = x.TemplateId,
                Created = x.Created,
                HasOriginal = x.TepGocId.HasValue
            })
            .ToListAsync(cancellationToken);
        return new Response<List<CvVersionViewModel>>(versions);
    }
}
