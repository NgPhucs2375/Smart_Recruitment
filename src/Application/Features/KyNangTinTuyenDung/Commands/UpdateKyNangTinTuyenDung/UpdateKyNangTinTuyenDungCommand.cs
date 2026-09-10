using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.KyNangTinTuyenDung.Commands.UpdateKyNangTinTuyenDung;

public class UpdateKyNangTinTuyenDungCommand : IRequest<Response<int>>
{
    public int Id { get; set; }

    public int TinTuyenDungId { get; set; }

    public int KyNangId { get; set; }

    public MucDoYC MucDoYeuCau { get; set; }
}

public class UpdateKyNangTinTuyenDungCommandHandler(
    IApplicationDbContext context)
    : IRequestHandler<UpdateKyNangTinTuyenDungCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        UpdateKyNangTinTuyenDungCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await context.KyNangTinTuyenDungs
            .FindAsync([request.Id], cancellationToken);

        if (entity == null)
        {
            return new Response<int>(
                "Không tìm thấy kỹ năng tin tuyển dụng.");
        }

        var tinTonTai = await context.TinTuyenDungs
            .AsNoTracking()
            .AnyAsync(
                x => x.Id == request.TinTuyenDungId,
                cancellationToken);

        if (!tinTonTai)
        {
            return new Response<int>(
                "Không tìm thấy tin tuyển dụng.");
        }

        var kyNangTonTai = await context.KyNangs
            .AsNoTracking()
            .AnyAsync(
                x => x.Id == request.KyNangId,
                cancellationToken);

        if (!kyNangTonTai)
        {
            return new Response<int>(
                "Không tìm thấy kỹ năng.");
        }

        var trungLap = await context.KyNangTinTuyenDungs
            .AsNoTracking()
            .AnyAsync(
                x => x.Id != request.Id &&
                     x.TinTuyenDungId == request.TinTuyenDungId &&
                     x.KyNangId == request.KyNangId,
                cancellationToken);

        if (trungLap)
        {
            return new Response<int>(
                "Kỹ năng này đã tồn tại trong tin tuyển dụng.");
        }

        entity.TinTuyenDungId = request.TinTuyenDungId;
        entity.KyNangId = request.KyNangId;
        entity.MucDoYeuCau = request.MucDoYeuCau;

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Cập nhật kỹ năng tin tuyển dụng thành công.");
    }
}
