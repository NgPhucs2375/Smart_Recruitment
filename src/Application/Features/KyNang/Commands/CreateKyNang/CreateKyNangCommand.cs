using Application.Interfaces;
using Application.Wrappers;
using Application.Features.KyNang.Cache;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using KyNangEntity = global::Domain.Entities.KyNang;

namespace Application.Features.KyNang.Commands.CreateKyNang;

public class CreateKyNangCommand : IRequest<Response<int>>
{
    public string TenKyNang { get; set; }

    public string MoTa { get; set; }
}

public class CreateKyNangCommandHandler(
    IApplicationDbContext context,
    IDistributedCache cache)
    : IRequestHandler<CreateKyNangCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        CreateKyNangCommand request,
        CancellationToken cancellationToken)
    {
        var tenKyNang = request.TenKyNang?.Trim();

        var daTonTai = await context.KyNangs
            .AsNoTracking()
            .AnyAsync(
                x => x.TenKyNang.ToLower() == tenKyNang.ToLower(),
                cancellationToken);

        if (daTonTai)
        {
            return new Response<int>(
                "Kỹ năng này đã tồn tại.");
        }

        var entity = new KyNangEntity
        {
            TenKyNang = tenKyNang,
            MoTa = request.MoTa?.Trim()
        };

        await context.KyNangs.AddAsync(
            entity,
            cancellationToken);

        await context.SaveChangesAsync(
            cancellationToken);

        await cache.SetStringAsync(
            KyNangCache.VersionKey,
            Guid.NewGuid().ToString("N"),
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Tạo kỹ năng thành công.");
    }
}
