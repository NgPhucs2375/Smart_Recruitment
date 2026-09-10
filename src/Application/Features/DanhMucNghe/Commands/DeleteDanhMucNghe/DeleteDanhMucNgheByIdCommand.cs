using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;
namespace Application.Features.DanhMucNghe.Commands.DeleteDanhMucNghe;
public class DeleteDanhMucNgheByIdCommand : IRequest<Response<int>> { public int Id { get; set; } }
public class DeleteDanhMucNgheByIdCommandHandler(IApplicationDbContext context) : IRequestHandler<DeleteDanhMucNgheByIdCommand, Response<int>>
{ public async Task<Response<int>> Handle(DeleteDanhMucNgheByIdCommand request, CancellationToken cancellationToken) {
        var entity = await context.DanhMucNghes.FindAsync([request.Id], cancellationToken);
        if (entity == null) return new Response<int>("Không tìm thấy danh mục nghề.");
        if (await context.TinTuyenDungs.AnyAsync(x => x.DanhMucNgheId == request.Id, cancellationToken))
            return new Response<int>("Không thể xóa danh mục đang được sử dụng."); context.DanhMucNghes.Remove(entity);
        await context.SaveChangesAsync(cancellationToken); return new Response<int>(data: entity.Id, message: "Xóa danh mục nghề thành công.");
    }
}
