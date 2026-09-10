using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.DanhGia.Commands.DeleteDanhGia;

public class DeleteDanhGiaByIdCommand : IRequest<Response<int>>
{
    public int Id { get; set; }
}

public class DeleteDanhGiaByIdCommandHandler(
    IApplicationDbContext context)
    : IRequestHandler<DeleteDanhGiaByIdCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        DeleteDanhGiaByIdCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await context.DanhGias
            .FindAsync([request.Id], cancellationToken);

        if (entity == null)
        {
            return new Response<int>(
                "Không tìm thấy đánh giá.");
        }

        context.DanhGias.Remove(entity);

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Xóa đánh giá thành công.");
    }
}
