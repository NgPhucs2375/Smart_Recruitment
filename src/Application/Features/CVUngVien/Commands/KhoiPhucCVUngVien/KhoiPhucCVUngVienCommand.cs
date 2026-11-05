using Application.Interfaces;
using Application.Wrappers;
using Application.Features.CVUngVien.Cache;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace Application.Features.CVUngVien.Commands.KhoiPhucCVUngVien;

public sealed class KhoiPhucCVUngVienCommand : IRequest<Response<int>>
{
    public int Id { get; set; }
}

public sealed class KhoiPhucCVUngVienCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService currentNguoiDungService,
    IDistributedCache cache)
    : IRequestHandler<KhoiPhucCVUngVienCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        KhoiPhucCVUngVienCommand request,
        CancellationToken cancellationToken)
    {
        var currentUser = await currentNguoiDungService.ResolveAsync();

        // Phạm vi chủ tài sản copy nguyên tắc của luồng xoá: chỉ chủ CV làm được,
        // admin không xoá hộ nên cũng không khôi phục hộ.
        var cv = await context.CVUngViens
            .AsTracking()
            .FirstOrDefaultAsync(
                x => x.Id == request.Id &&
                     x.IsDaXoa &&
                     x.HoSoUngVien.NguoiDungId == currentUser.Id,
                cancellationToken);

        if (cv == null)
            return new Response<int>("Không tìm thấy CV đã xóa.");

        cv.IsDaXoa = false;

        // Lúc xoá, default được đôn sang CV khác. Khi trả CV về, chỉ nhận default
        // nếu hồ sơ đang không còn CV sống nào làm default — giành mất default của
        // CV người dùng đang dùng là lỗi, dù CV khôi phục cũ hơn hay mới hơn.
        var hoSoConDefault = await context.CVUngViens
            .AnyAsync(
                x => x.HoSoUngVienId == cv.HoSoUngVienId &&
                     x.Id != cv.Id &&
                     x.IsDefault &&
                     !x.IsDaXoa,
                cancellationToken);
        cv.IsDefault = !hoSoConDefault;

        await context.SaveChangesAsync(cancellationToken);
        await CVUngVienListCache.InvalidateAsync(
            cache,
            currentUser.Id,
            cancellationToken,
            new[] { cv.Id });

        return new Response<int>(cv.Id, "Đã khôi phục CV.");
    }
}
