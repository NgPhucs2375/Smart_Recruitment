using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using KyNangTinTuyenDungEntity = global::Domain.Entities.KyNangTinTuyenDung;

namespace Application.Features.KyNangTinTuyenDung.Commands.CreateKyNangTinTuyenDung;

public class CreateKyNangTinTuyenDungCommand : IRequest<Response<int>>
{
    public int TinTuyenDungId { get; set; }

    public int KyNangId { get; set; }

    public MucDoYC MucDoYeuCau { get; set; }
}

public class CreateKyNangTinTuyenDungCommandHandler(
    IApplicationDbContext context)
    : IRequestHandler<CreateKyNangTinTuyenDungCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        CreateKyNangTinTuyenDungCommand request,
        CancellationToken cancellationToken)
    {
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

        var daTonTai = await context.KyNangTinTuyenDungs
            .AsNoTracking()
            .AnyAsync(
                x => x.TinTuyenDungId == request.TinTuyenDungId &&
                     x.KyNangId == request.KyNangId,
                cancellationToken);

        if (daTonTai)
        {
            return new Response<int>(
                "Kỹ năng này đã tồn tại trong tin tuyển dụng.");
        }

        var entity = new KyNangTinTuyenDungEntity
        {
            TinTuyenDungId = request.TinTuyenDungId,
            KyNangId = request.KyNangId,
            MucDoYeuCau = request.MucDoYeuCau
        };

        await context.KyNangTinTuyenDungs.AddAsync(
            entity,
            cancellationToken);

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Tạo kỹ năng tin tuyển dụng thành công.");
    }
}
