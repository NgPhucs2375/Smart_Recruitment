using Application.Interfaces;
using Application.Wrappers;
using MediatR;
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
            context.HoSoUngViens.Remove(entity);

            await context.SaveChangesAsync(
                cancellationToken);

            return new Response<int>(
                data: entity.Id,
                message: "Xóa hồ sơ ứng viên thành công.");
        }
    }
}
