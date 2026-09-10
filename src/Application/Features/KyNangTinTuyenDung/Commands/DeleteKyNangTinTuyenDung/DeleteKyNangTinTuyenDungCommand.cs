using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KyNangTinTuyenDung.Commands.DeleteKyNangTinTuyenDung
{
    public class DeleteKyNangTinTuyenDungByIdCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
    }

    public class DeleteKyNangTinTuyenDungByIdCommandHandler(
        IApplicationDbContext context)
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

            context.KyNangTinTuyenDungs.Remove(entity);

            await context.SaveChangesAsync(
                cancellationToken);

            return new Response<int>(
                data: entity.Id,
                message: "Xóa kỹ năng tin tuyển dụng thành công.");
        }
    }
}
