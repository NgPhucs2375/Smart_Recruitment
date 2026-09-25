using Application.Interfaces;
using Application.Wrappers;
using Application.Features.DanhMucNghe.Cache;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace Application.Features.DanhMucNghe.Commands.UpdateDanhMucNghe;

public class UpdateDanhMucNgheCommand : IRequest<Response<int>>
{
    public int Id { get; set; }

    public string TenNghe { get; set; }

    public string MoTa { get; set; }
}

public class UpdateDanhMucNgheCommandHandler(
    IApplicationDbContext context,
    IDistributedCache cache)
    : IRequestHandler<UpdateDanhMucNgheCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        UpdateDanhMucNgheCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await context.DanhMucNghes
            .FindAsync([request.Id], cancellationToken);

        if (entity == null)
        {
            return new Response<int>(
                "Không tìm thấy danh mục nghề.");
        }

        var tenNghe = request.TenNghe?.Trim();

        var trungLap = await context.DanhMucNghes
            .AsNoTracking()
            .AnyAsync(
                x => x.Id != request.Id &&
                     x.TenNghe.ToLower() == tenNghe.ToLower(),
                cancellationToken);

        if (trungLap)
        {
            return new Response<int>(
                "Tên ngành nghề đã tồn tại.");
        }

        entity.TenNghe = tenNghe;
        entity.MoTa = request.MoTa?.Trim();

        await context.SaveChangesAsync(
            cancellationToken);

        await cache.SetStringAsync(
            DanhMucNgheCache.VersionKey,
            Guid.NewGuid().ToString("N"),
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Cập nhật danh mục nghề thành công.");
    }
}
