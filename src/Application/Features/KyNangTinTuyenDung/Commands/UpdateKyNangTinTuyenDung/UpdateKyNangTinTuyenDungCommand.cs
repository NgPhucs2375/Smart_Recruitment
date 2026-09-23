using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace Application.Features.KyNangTinTuyenDung.Commands.UpdateKyNangTinTuyenDung;

public class UpdateKyNangTinTuyenDungCommand : IRequest<Response<int>>
{
    public int Id { get; set; }

    public int TinTuyenDungId { get; set; }

    public int KyNangId { get; set; }

    public MucDoYC MucDoYeuCau { get; set; }
}

public class UpdateKyNangTinTuyenDungCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
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

        // Nhân sự / Người đại diện chỉ sửa kỹ năng của tin trong phạm vi mình
        // (xét cả tin hiện tại của record lẫn tin đích khi chuyển tin).
        var ctx = await current.ResolveAsync();
        if (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU ||
            ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
        {
            foreach (var tinId in new[] { entity.TinTuyenDungId, request.TinTuyenDungId }.Distinct())
            {
                var trongPhamVi = await context.TinTuyenDungs
                    .AsNoTracking()
                    .AnyAsync(
                        x => x.Id == tinId &&
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
