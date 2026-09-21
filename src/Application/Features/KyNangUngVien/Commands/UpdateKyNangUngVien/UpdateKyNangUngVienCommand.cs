using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.KyNangUngVien.Commands.UpdateKyNangUngVien;

public class UpdateKyNangUngVienCommand : IRequest<Response<int>>
{
    public int Id { get; set; }

    public int KyNangId { get; set; }

    public float? SoNamKinhNghiem { get; set; }
}

public class UpdateKyNangUngVienCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<UpdateKyNangUngVienCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        UpdateKyNangUngVienCommand request,
        CancellationToken cancellationToken)
    {
        var entity = await context.KyNangUngViens
            .FindAsync([request.Id], cancellationToken);

        if (entity == null)
        {
            return new Response<int>(
                "Không tìm thấy kỹ năng ứng viên.");
        }

        var ctx = await current.ResolveAsync();

        if (ctx.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN)
        {
            var laCuaMinh = await context.HoSoUngViens
                .AsNoTracking()
                .AnyAsync(
                    x => x.Id == entity.HoSoUngVienId && x.NguoiDungId == ctx.Id,
                    cancellationToken);
            if (!laCuaMinh)
            {
                return new Response<int>(
                    "Bạn không có quyền sửa kỹ năng này.");
            }
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

        var trungSkill = await context.KyNangUngViens
            .AsNoTracking()
            .AnyAsync(
                x => x.Id != request.Id &&
                     x.HoSoUngVienId == entity.HoSoUngVienId &&
                     x.KyNangId == request.KyNangId,
                cancellationToken);

        if (trungSkill)
        {
            return new Response<int>(
                "Kỹ năng này đã có trong hồ sơ của bạn.");
        }

        entity.KyNangId = request.KyNangId;
        entity.SoNamKinhNghiem = request.SoNamKinhNghiem;

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Cập nhật kỹ năng thành công.");
    }
}
