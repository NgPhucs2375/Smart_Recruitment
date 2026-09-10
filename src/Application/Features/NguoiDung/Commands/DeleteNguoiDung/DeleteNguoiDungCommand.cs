using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.NguoiDung.Commands.DeleteNguoiDung
{
    public class DeleteNguoiDungCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
    }

    public class DeleteNguoiDungCommandHandler(
        IApplicationDbContext context)
        : IRequestHandler<DeleteNguoiDungCommand, Response<int>>
    {
        public async Task<Response<int>> Handle(
            DeleteNguoiDungCommand request,
            CancellationToken cancellationToken)
        {
            var entity = await context.NguoiDungs
                .FindAsync([request.Id], cancellationToken);

            if (entity == null)
            {
                return new Response<int>(
                    "Không tìm thấy người dùng.");
            }

            context.NguoiDungs.Remove(entity);

            await context.SaveChangesAsync(
                cancellationToken);

            return new Response<int>(
                data: entity.Id,
                message: "Xóa người dùng thành công.");
        }
    }
}
