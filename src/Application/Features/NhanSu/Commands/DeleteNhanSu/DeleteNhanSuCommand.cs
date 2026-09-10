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
        IAuthenticatedUserService auth)
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

            var target = await context.HoSoNhaTuyenDungs
                .Include(h => h.NguoiDung)
                .FirstOrDefaultAsync(
                    h => h.Id == request.Id,
                    cancellationToken);

            if (target == null)
            {
                throw new ApiException(
                    "Không tìm thấy nhân sự.");
            }

            if (target.DoanhNghiepId != myHs.DoanhNghiepId)
            {
                throw new ApiException(
                    "Bạn không có quyền xóa nhân sự này.");
            }

            context.HoSoNhaTuyenDungs.Remove(target);

            if (target.NguoiDung != null)
            {
                target.NguoiDung.VaiTro = VaiTroNguoiDung.UNG_VIEN;
            }

            await context.SaveChangesAsync(
                cancellationToken);

            return new Response<string>(
                target.NguoiDungId.ToString(),
                "Đã xóa nhân sự khỏi doanh nghiệp.");
        }
    }
}
