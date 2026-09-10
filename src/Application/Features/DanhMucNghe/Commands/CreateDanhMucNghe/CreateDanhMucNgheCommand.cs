using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;
using DanhMucNgheEntity = global::Domain.Entities.DanhMucNghe;

namespace Application.Features.DanhMucNghe.Commands.CreateDanhMucNghe;

public class CreateDanhMucNgheCommand : IRequest<Response<int>>
{
    public string TenNghe { get; set; }

    public string MoTa { get; set; }
}

public class CreateDanhMucNgheCommandHandler(
    IApplicationDbContext context)
    : IRequestHandler<CreateDanhMucNgheCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        CreateDanhMucNgheCommand request,
        CancellationToken cancellationToken)
    {
        var tenNghe = request.TenNghe.Trim();

        var daTonTai = await context.DanhMucNghes
            .AsNoTracking()
            .AnyAsync(
                x => x.TenNghe.ToLower() == tenNghe.ToLower(),
                cancellationToken);

        if (daTonTai)
        {
            return new Response<int>(
                "Tên ngành nghề đã tồn tại.");
        }

        var entity = new DanhMucNgheEntity
        {
            TenNghe = tenNghe,
            MoTa = request.MoTa?.Trim(),
            IsActive = true
        };

        await context.DanhMucNghes.AddAsync(
            entity,
            cancellationToken);

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Tạo danh mục nghề thành công.");
    }
}