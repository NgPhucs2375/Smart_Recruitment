using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KyNangUngVien.Commands.DeleteKyNangUngVien
{
    public class DeleteKyNangUngVienByIdCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
    }

    public class DeleteKyNangUngVienByIdCommandHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current)
        : IRequestHandler<DeleteKyNangUngVienByIdCommand, Response<int>>
    {
        public async Task<Response<int>> Handle(
            DeleteKyNangUngVienByIdCommand request,
            CancellationToken cancellationToken)
        {
            var entity = await context.KyNangUngViens
                .FindAsync([request.Id], cancellationToken);

            if (entity == null)
            {
                return new Response<int>(
                    "Không tìm thấy kỹ năng ứng viên.");
            }

            var ctx = await current.ResolveAsync();

            if (ctx.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN)
            {
                var laCuaMinh = await context.HoSoUngViens
                    .AsNoTracking()
                    .AnyAsync(
                        x => x.Id == entity.HoSoUngVienId && x.NguoiDungId == ctx.Id,
                        cancellationToken);
                if (!laCuaMinh)
                {
                    return new Response<int>(
                        "Bạn không có quyền xóa kỹ năng này.");
                }
            }

            context.KyNangUngViens.Remove(entity);

            await context.SaveChangesAsync(
                cancellationToken);

            return new Response<int>(
                data: entity.Id,
                message: "Xóa kỹ năng thành công.");
        }
    }
}
