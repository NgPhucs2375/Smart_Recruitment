using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CVUngVien.Commands.DeleteCVUngVien;

public class DeleteCVUngVienByIdCommand : IRequest<Response<int>>
{
    public int Id { get; set; }
}

public class DeleteCVUngVienByIdCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
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

        // DbContext NoTracking toàn cục: Find/FirstOrDefault trả về entity
        // không track — Attach cùng reference (không throw duplicate-track).
        context.CVUngViens.Attach(entity);

        // Xóa mềm: giữ record để DonUngTuyen cũ vẫn tham chiếu được (FK CVUngVienId).
        var wasDefault = entity.IsDefault;
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
            }
        }

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Đã xóa CV thành công.");
    }
}
