using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.HoSoNhaTuyenDung.Commands.DeleteHoSoNhaTuyenDung
{
    public class DeleteHoSoNhaTuyenDungCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
    }

    public class DeleteHoSoNhaTuyenDungCommandHandler(
        IApplicationDbContext context, ICurrentNguoiDungService current)
        : IRequestHandler<DeleteHoSoNhaTuyenDungCommand, Response<int>>
    {
        public async Task<Response<int>> Handle(
            DeleteHoSoNhaTuyenDungCommand request,
            CancellationToken cancellationToken)
        {
            var entity = await context.HoSoNhaTuyenDungs
                .FindAsync([request.Id], cancellationToken);

            if (entity == null)
            {
                return new Response<int>(
                    "Không tìm thấy hồ sơ nhà tuyển dụng.");
            }

            if ((await current.ResolveAsync()).VaiTro != Domain.Enums.VaiTroNguoiDung.QUAN_TRI_VIEN)
                throw new Application.Exceptions.ApiException("Gỡ Nhân sự phải qua luồng quản lý Nhân sự; không được xóa trực tiếp liên kết doanh nghiệp.", 403);
            context.HoSoNhaTuyenDungs.Remove(entity);

            await context.SaveChangesAsync(
                cancellationToken);

            return new Response<int>(
                data: entity.Id,
                message: "Xóa hồ sơ nhà tuyển dụng thành công.");
        }
    }
}
