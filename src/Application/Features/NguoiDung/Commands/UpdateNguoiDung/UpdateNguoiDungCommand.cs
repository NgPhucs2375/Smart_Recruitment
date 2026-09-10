using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.NguoiDung.Commands.UpdateNguoiDung;

public class UpdateNguoiDungCommand : IRequest<Response<int>>
{
    public int Id { get; set; }

    public string ApplicationUserId { get; set; }

    public VaiTroNguoiDung VaiTro { get; set; }

    public bool IsActive { get; set; }
}

public class UpdateNguoiDungCommandHandler(
    IApplicationDbContext context)
    : IRequestHandler<UpdateNguoiDungCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        UpdateNguoiDungCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await context.NguoiDungs
            .FindAsync([request.Id], cancellationToken);

        if (entity == null)
        {
            return new Response<int>(
                "Không tìm thấy người dùng.");
        }

        var applicationUserId = request.ApplicationUserId?.Trim();

        var trungLap = await context.NguoiDungs
            .AsNoTracking()
            .AnyAsync(
                x => x.Id != request.Id &&
                     x.ApplicationUserId == applicationUserId,
                cancellationToken);

        if (trungLap)
        {
            return new Response<int>(
                "Mã người dùng ứng dụng đã được sử dụng.");
        }

        entity.ApplicationUserId = applicationUserId;
        entity.VaiTro = request.VaiTro;
        entity.IsActive = request.IsActive;

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Cập nhật người dùng thành công.");
    }
}
