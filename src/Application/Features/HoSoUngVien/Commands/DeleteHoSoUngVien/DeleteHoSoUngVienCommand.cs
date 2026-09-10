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
        IApplicationDbContext context)
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

            context.HoSoUngViens.Remove(entity);

            await context.SaveChangesAsync(
                cancellationToken);

            return new Response<int>(
                data: entity.Id,
                message: "Xóa hồ sơ ứng viên thành công.");
        }
    }
}
