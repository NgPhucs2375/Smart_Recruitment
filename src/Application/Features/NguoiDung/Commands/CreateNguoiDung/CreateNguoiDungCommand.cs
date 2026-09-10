using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NguoiDungEntity = global::Domain.Entities.NguoiDung;

namespace Application.Features.NguoiDung.Commands.CreateNguoiDung;

public class CreateNguoiDungCommand : IRequest<Response<int>>
{
    public string ApplicationUserId { get; set; }

    public VaiTroNguoiDung VaiTro { get; set; }

    public bool IsActive { get; set; } = true;
}

public class CreateNguoiDungCommandHandler(
    IApplicationDbContext context)
    : IRequestHandler<CreateNguoiDungCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        CreateNguoiDungCommand request,
        CancellationToken cancellationToken)
    {
        var applicationUserId = request.ApplicationUserId?.Trim();

        var daTonTai = await context.NguoiDungs
            .AsNoTracking()
            .AnyAsync(
                x => x.ApplicationUserId == applicationUserId,
                cancellationToken);

        if (daTonTai)
        {
            return new Response<int>(
                "Người dùng này đã tồn tại.");
        }

        var entity = new NguoiDungEntity
        {
            ApplicationUserId = applicationUserId,
            VaiTro = request.VaiTro,
            IsActive = request.IsActive
        };

        await context.NguoiDungs.AddAsync(
            entity,
            cancellationToken);

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Tạo người dùng thành công.");
    }
}
