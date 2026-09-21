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
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<CreateKyNangTinTuyenDungCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        CreateKyNangTinTuyenDungCommand request,
        CancellationToken cancellationToken)
    {
        // Nhân sự / Người đại diện chỉ gắn kỹ năng cho tin trong phạm vi mình.
        var ctx = await current.ResolveAsync();
        if (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU ||
            ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
        {
            var trongPhamVi = await context.TinTuyenDungs
                .AsNoTracking()
                .AnyAsync(
                    x => x.Id == request.TinTuyenDungId &&
                        (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU
                            ? x.NguoiDangTinId == ctx.Id
                            : x.DoanhNghiepId == ctx.DoanhNghiepId),
                    cancellationToken);
            if (!trongPhamVi)
            {
                return new Response<int>(
                    "Bạn không có quyền thao tác kỹ năng trên tin tuyển dụng này.");
            }
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
