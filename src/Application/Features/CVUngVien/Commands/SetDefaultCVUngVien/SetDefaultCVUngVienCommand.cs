using Application.Interfaces;
using Application.Wrappers;
using Application.Features.CVUngVien.Cache;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace Application.Features.CVUngVien.Commands.SetDefaultCVUngVien;

public sealed class SetDefaultCVUngVienCommand : IRequest<Response<int>>
{
    public int Id { get; set; }
}

public sealed class SetDefaultCVUngVienCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService currentNguoiDungService,
    IDistributedCache cache)
    : IRequestHandler<SetDefaultCVUngVienCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        SetDefaultCVUngVienCommand request,
        CancellationToken cancellationToken)
    {
        var currentUser = await currentNguoiDungService.ResolveAsync();
        var cv = await context.CVUngViens
            .FirstOrDefaultAsync(
                x => x.Id == request.Id &&
                     !x.IsDaXoa &&
                     x.HoSoUngVien.NguoiDungId == currentUser.Id,
                cancellationToken);

        if (cv == null)
            return new Response<int>("Không tìm thấy CV.");

        var oldDefaults = await context.CVUngViens
            .Where(x => x.HoSoUngVienId == cv.HoSoUngVienId &&
                        x.Id != cv.Id &&
                        x.IsDefault &&
                        !x.IsDaXoa)
            .ToListAsync(cancellationToken);

        oldDefaults.ForEach(x => x.IsDefault = false);
        cv.IsDefault = true;
        context.CVUngViens.UpdateRange(oldDefaults);
        context.CVUngViens.Update(cv);
        await context.SaveChangesAsync(cancellationToken);
        await CVUngVienListCache.InvalidateAsync(
            cache,
            currentUser.Id,
            cancellationToken,
            oldDefaults.Select(x => x.Id).Append(cv.Id).ToArray());

        return new Response<int>(cv.Id, "Đã đặt CV làm mặc định.");
    }
}
