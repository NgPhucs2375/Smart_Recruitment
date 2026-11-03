using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CVUngVien.Queries.GetThungRacCVUngViens;

public class ThungRacCVUngVienViewModel
{
    public int Id { get; set; }

    public int HoSoUngVienId { get; set; }

    public string TenFile { get; set; }

    public string? HoTen { get; set; }

    public string? ViTriUngTuyen { get; set; }

    public PhuongThucTaoCV PhuongThucTao { get; set; }

    /// <summary>Lần chỉnh sửa cuối chính là lúc xoá, vì xoá mềm chỉ đổi cờ IsDaXoa.</summary>
    public DateTime? NgayXoa { get; set; }
}

public class GetThungRacCVUngViensQuery
    : IRequest<Response<List<ThungRacCVUngVienViewModel>>>
{
}

public class GetThungRacCVUngViensQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService currentNguoiDungService)
    : IRequestHandler<GetThungRacCVUngViensQuery, Response<List<ThungRacCVUngVienViewModel>>>
{
    public async Task<Response<List<ThungRacCVUngVienViewModel>>> Handle(
        GetThungRacCVUngViensQuery request,
        CancellationToken cancellationToken)
    {
        var currentUser = await currentNguoiDungService.ResolveAsync();

        var items = await context.CVUngViens
            .AsNoTracking()
            .Where(x => x.IsDaXoa && x.HoSoUngVien.NguoiDungId == currentUser.Id)
            .OrderByDescending(x => x.LastModified)
            .Select(x => new ThungRacCVUngVienViewModel
            {
                Id = x.Id,
                HoSoUngVienId = x.HoSoUngVienId,
                TenFile = x.TenFile,
                HoTen = x.ThongTinLienHe != null ? x.ThongTinLienHe.HoTen : null,
                ViTriUngTuyen = x.ThongTinLienHe != null
                    ? x.ThongTinLienHe.ViTriUngTuyen
                    : null,
                PhuongThucTao = x.PhuongThucTao,
                NgayXoa = x.LastModified
            })
            .ToListAsync(cancellationToken);

        return new Response<List<ThungRacCVUngVienViewModel>>(
            items,
            "Lấy danh sách CV đã xóa thành công.");
    }
}
