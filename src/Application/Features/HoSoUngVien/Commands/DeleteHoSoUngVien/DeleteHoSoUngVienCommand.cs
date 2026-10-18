using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.HoSoUngVien.Commands.DeleteHoSoUngVien
{
    public class DeleteHoSoUngVienByIdCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
    }

    public class DeleteHoSoUngVienByIdCommandHandler(
        IApplicationDbContext context, ICurrentNguoiDungService current)
        : IRequestHandler<DeleteHoSoUngVienByIdCommand, Response<int>>
    {
        public async Task<Response<int>> Handle(
            DeleteHoSoUngVienByIdCommand request,
            CancellationToken cancellationToken)
        {
            var entity = await context.HoSoUngViens
                .FindAsync([request.Id], cancellationToken);

            if (entity == null)
            {
                return new Response<int>(
                    "Không tìm thấy hồ sơ ứng viên.");
            }

            var actor = await current.ResolveAsync();
            if (actor.VaiTro != Domain.Enums.VaiTroNguoiDung.QUAN_TRI_VIEN &&
                (actor.VaiTro != Domain.Enums.VaiTroNguoiDung.UNG_VIEN || entity.NguoiDungId != actor.Id))
                throw new Application.Exceptions.ApiException("Bạn không có quyền xóa hồ sơ này.", 403);

            // Xóa hồ sơ cascade toàn bộ CV. Đơn ứng tuyển giữ FK Restrict
            // tới CV nên phải chặn trước, tránh lỗi 500 và giữ lịch sử ứng tuyển.
            var coDonUngTuyen = await context.DonUngTuyens
                .AsNoTracking()
                .AnyAsync(
                    d => d.CVUngVien.HoSoUngVienId == entity.Id,
                    cancellationToken);

            if (coDonUngTuyen)
                throw new Application.Exceptions.ApiException(
                    "Hồ sơ đã có đơn ứng tuyển, không thể xóa để giữ lịch sử.", 400);

            context.HoSoUngViens.Remove(entity);

            await context.SaveChangesAsync(
                cancellationToken);

            return new Response<int>(
                data: entity.Id,
                message: "Xóa hồ sơ ứng viên thành công.");
        }
    }
}
