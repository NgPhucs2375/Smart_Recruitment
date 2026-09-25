using Application.Interfaces;
using Application.Wrappers;
using Application.Features.DanhMucNghe.Cache;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
namespace Application.Features.DanhMucNghe.Commands.DeleteDanhMucNghe{
public class DeleteDanhMucNgheByIdCommand : IRequest<Response<int>>
{
    public int Id { get; set; }
}

public class DeleteDanhMucNgheByIdCommandHandler(
    IApplicationDbContext context,
    IDistributedCache cache)
    : IRequestHandler<DeleteDanhMucNgheByIdCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        DeleteDanhMucNgheByIdCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await context.DanhMucNghes
            .FindAsync([request.Id], cancellationToken);

        if (entity == null)
        {
            return new Response<int>(
                "Không tìm thấy danh mục nghề.");
        }

        var dangSuDung = await context.TinTuyenDungs
            .AsNoTracking()
            .AnyAsync(
                x => x.DanhMucNgheId == request.Id,
                cancellationToken);

        if (dangSuDung)
        {
            return new Response<int>(
                "Không thể xóa danh mục đang được sử dụng.");
        }

        context.DanhMucNghes.Remove(entity);

        await context.SaveChangesAsync(
            cancellationToken);

        await cache.SetStringAsync(
            DanhMucNgheCache.VersionKey,
            Guid.NewGuid().ToString("N"),
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Xóa danh mục nghề thành công.");
    }
}
}