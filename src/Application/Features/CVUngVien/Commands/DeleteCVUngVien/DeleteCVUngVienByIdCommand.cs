using Application.Interfaces;
using Application.Wrappers;
using Application.Features.CVUngVien.Cache;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace Application.Features.CVUngVien.Commands.DeleteCVUngVien;

public class DeleteCVUngVienByIdCommand : IRequest<Response<int>>
{
    public int Id { get; set; }
}

public class DeleteCVUngVienByIdCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current,
    IDistributedCache cache)
    : IRequestHandler<DeleteCVUngVienByIdCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        DeleteCVUngVienByIdCommand request,
        CancellationToken cancellationToken)
    {
        var currentUser = await current.ResolveAsync();

        var entity = await context.CVUngViens
            .FirstOrDefaultAsync(
                x => x.Id == request.Id &&
                     !x.IsDaXoa &&
                     x.HoSoUngVien.NguoiDungId == currentUser.Id,
                cancellationToken);

        if (entity == null)
        {
            return new Response<int>(
                "Không tìm thấy CV.");
        }

        // Xóa mềm: giữ record để DonUngTuyen cũ vẫn tham chiếu được (FK CVUngVienId).
        var wasDefault = entity.IsDefault;
        var replacementId = 0;
        entity.IsDaXoa = true;
        entity.IsDefault = false;

        // Nếu CV bị xóa là default thì đôn CV mới nhất khác (chưa xóa) lên default.
        if (wasDefault)
        {
            var replacement = await context.CVUngViens
                .AsTracking()
                .Where(x => x.HoSoUngVienId == entity.HoSoUngVienId
                    && x.Id != entity.Id
                    && !x.IsDaXoa)
                .OrderByDescending(x => x.Created)
                .FirstOrDefaultAsync(cancellationToken);

            if (replacement != null)
            {
                replacement.IsDefault = true;
                replacementId = replacement.Id;
            }
        }

        await context.SaveChangesAsync(
            cancellationToken);
        await CVUngVienListCache.InvalidateAsync(
            cache,
            currentUser.Id,
            cancellationToken,
            replacementId > 0
                ? new[] { entity.Id, replacementId }
                : new[] { entity.Id });

        return new Response<int>(
            data: entity.Id,
            message: "Đã xóa CV thành công.");
    }
}
