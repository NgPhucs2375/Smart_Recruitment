using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KyNangTinTuyenDung.Commands.DeleteKyNangTinTuyenDung
{
    public class DeleteKyNangTinTuyenDungByIdCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
    }

    public class DeleteKyNangTinTuyenDungByIdCommandHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current)
        : IRequestHandler<DeleteKyNangTinTuyenDungByIdCommand, Response<int>>
    {
        public async Task<Response<int>> Handle(
            DeleteKyNangTinTuyenDungByIdCommand request,
            CancellationToken cancellationToken)
        {
            var entity = await context.KyNangTinTuyenDungs
                .FindAsync([request.Id], cancellationToken);

            if (entity == null)
            {
                return new Response<int>(
                    "Không tìm thấy kỹ năng tin tuyển dụng.");
            }

            // Nhân sự / Người đại diện chỉ xóa kỹ năng của tin trong phạm vi mình.
            var ctx = await current.ResolveAsync();
            if (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU ||
                ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
            {
                var trongPhamVi = await context.TinTuyenDungs
                    .AsNoTracking()
                    .AnyAsync(
                        x => x.Id == entity.TinTuyenDungId &&
                            (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU
                                ? x.NguoiDangTinId == ctx.Id
                                : x.DoanhNghiepId == ctx.DoanhNghiepId),
                        cancellationToken);
                if (!trongPhamVi)
                {
                    return new Response<int>(
                        "Bạn không có quyền thao tác kỹ năng trên tin tuyển dụng này.");
                }
            }

            context.KyNangTinTuyenDungs.Remove(entity);

            await context.SaveChangesAsync(
                cancellationToken);

            return new Response<int>(
                data: entity.Id,
                message: "Xóa kỹ năng tin tuyển dụng thành công.");
        }
    }
}
