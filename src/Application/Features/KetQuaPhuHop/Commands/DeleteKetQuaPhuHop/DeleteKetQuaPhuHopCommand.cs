using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KetQuaPhuHop.Commands.DeleteKetQuaPhuHop
{
    public class DeleteKetQuaPhuHopByIdCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
    }

    public class DeleteKetQuaPhuHopByIdCommandHandler(
        IApplicationDbContext context)
        : IRequestHandler<DeleteKetQuaPhuHopByIdCommand, Response<int>>
    {
        public async Task<Response<int>> Handle(
            DeleteKetQuaPhuHopByIdCommand request,
            CancellationToken cancellationToken)
        {
            var entity = await context.KetQuaPhuHops
                .FindAsync([request.Id], cancellationToken);

            if (entity == null)
            {
                return new Response<int>(
                    "Không tìm thấy kết quả phù hợp.");
            }

            context.KetQuaPhuHops.Remove(entity);

            await context.SaveChangesAsync(
                cancellationToken);

            return new Response<int>(
                data: entity.Id,
                message: "Xóa kết quả phù hợp thành công.");
        }
    }
}
