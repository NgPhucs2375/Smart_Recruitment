using Application.Exceptions;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.NhanSu.Commands.DeleteNhanSu
{
    public class DeleteNhanSuCommand : IRequest<Response<string>>
    {
        public int Id { get; set; }
    }

    public class DeleteNhanSuCommandHandler(
        IApplicationDbContext context,
        IAuthenticatedUserService auth,
        IAccountService accountService)
        : IRequestHandler<DeleteNhanSuCommand, Response<string>>
    {
        public async Task<Response<string>> Handle(
            DeleteNhanSuCommand request,
            CancellationToken cancellationToken)
        {
            var ndd = await context.NguoiDungs
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.ApplicationUserId == auth.UserId,
                    cancellationToken);

            if (ndd == null)
            {
                throw new ApiException(
                    "Không xác định người dùng.");
            }

            var myHs = await context.HoSoNhaTuyenDungs
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.NguoiDungId == ndd.Id,
                    cancellationToken);

            if (myHs == null)
            {
                throw new ApiException(
                    "Không xác định doanh nghiệp.");
            }

            // Chấp nhận cả HoSoId và NguoiDungId (FE cũ gửi nguoiDungId, BE tra theo HoSo.Id).
            // Ưu tiên HoSo.Id, fallback sang NguoiDungId trong cùng doanh nghiệp.
            var target = await context.HoSoNhaTuyenDungs
                .Include(h => h.NguoiDung)
                .FirstOrDefaultAsync(
                    h => h.Id == request.Id && h.DoanhNghiepId == myHs.DoanhNghiepId,
                    cancellationToken);

            target ??= await context.HoSoNhaTuyenDungs
                .Include(h => h.NguoiDung)
                .FirstOrDefaultAsync(
                    h => h.NguoiDungId == request.Id && h.DoanhNghiepId == myHs.DoanhNghiepId,
                    cancellationToken);

            if (target == null)
            {
                throw new ApiException(
                    "Không tìm thấy nhân sự.");
            }

            // Không cho tự xóa chính mình (người đại diện) qua API này
            if (target.NguoiDungId == ndd.Id)
            {
                throw new ApiException(
                    "Không thể xóa chính tài khoản của bạn.");
            }

            context.HoSoNhaTuyenDungs.Remove(target);

            string removedAppUserId = null;
            if (target.NguoiDung != null)
            {
                target.NguoiDung.VaiTro = VaiTroNguoiDung.UNG_VIEN;
                removedAppUserId = target.NguoiDung.ApplicationUserId;
            }

            await context.SaveChangesAsync(
                cancellationToken);

            // Gỡ role NHAN_SU phía Identity — nếu không họ vẫn vào cổng employer
            // và giữ quyền tintuyendungs.* theo Casbin dù không thuộc DN nào.
            if (!string.IsNullOrWhiteSpace(removedAppUserId))
            {
                try { await accountService.RemoveNhanSuRoleAsync(removedAppUserId); }
                catch { /* đã xóa profile nghiệp vụ; lỗi role không chặn response */ }
            }

            return new Response<string>(
                target.NguoiDungId.ToString(),
                "Đã xóa nhân sự khỏi doanh nghiệp.");
        }
    }
}
