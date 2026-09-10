using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KyNang.Commands.DeleteKyNang
{
    public class DeleteKyNangByIdCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
    }

    public class DeleteKyNangByIdCommandHandler(
        IApplicationDbContext context)
        : IRequestHandler<DeleteKyNangByIdCommand, Response<int>>
    {
        public async Task<Response<int>> Handle(
            DeleteKyNangByIdCommand request,
            CancellationToken cancellationToken)
        {
            var entity = await context.KyNangs
                .FindAsync([request.Id], cancellationToken);

            if (entity == null)
            {
                return new Response<int>(
                    "Không tìm thấy kỹ năng.");
            }

            context.KyNangs.Remove(entity);

            await context.SaveChangesAsync(
                cancellationToken);

            return new Response<int>(
                data: entity.Id,
                message: "Xóa kỹ năng thành công.");
        }
    }
}
