using Application.Interfaces;
using Application.Wrappers;
using Application.Features.KyNang.Cache;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace Application.Features.KyNang.Commands.UpdateKyNang;

public class UpdateKyNangCommand : IRequest<Response<int>>
{
    public int Id { get; set; }

    public string TenKyNang { get; set; }

    public string MoTa { get; set; }
}

public class UpdateKyNangCommandHandler(
    IApplicationDbContext context,
    IDistributedCache cache)
    : IRequestHandler<UpdateKyNangCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        UpdateKyNangCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await context.KyNangs
            .FindAsync([request.Id], cancellationToken);

        if (entity == null)
        {
            return new Response<int>(
                "Không tìm thấy kỹ năng.");
        }

        var tenKyNang = request.TenKyNang?.Trim();

        var trungLap = await context.KyNangs
            .AsNoTracking()
            .AnyAsync(
                x => x.Id != request.Id &&
                     x.TenKyNang.ToLower() == tenKyNang.ToLower(),
                cancellationToken);

        if (trungLap)
        {
            return new Response<int>(
                "Kỹ năng này đã tồn tại.");
        }

        entity.TenKyNang = tenKyNang;
        entity.MoTa = request.MoTa?.Trim();

        await context.SaveChangesAsync(
            cancellationToken);

        await cache.SetStringAsync(
            KyNangCache.VersionKey,
            Guid.NewGuid().ToString("N"),
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Cập nhật kỹ năng thành công.");
    }
}
