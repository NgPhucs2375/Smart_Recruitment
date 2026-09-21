using Application.DTOs.KyNangUngVien;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using KyNangUngVienEntity = global::KyNangUngVien;

namespace Application.Features.KyNangUngVien.Commands.CreateKyNangUngVien;

public class CreateKyNangUngVienCommand : IRequest<Response<int>>
{
    public int KyNangId { get; set; }

    public float? SoNamKinhNghiem { get; set; }

    /// <summary>Hồ sơ đích. null = hồ sơ của chính user đang đăng nhập.</summary>
    public int? HoSoUngVienId { get; set; }
}

public class CreateKyNangUngVienCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<CreateKyNangUngVienCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        CreateKyNangUngVienCommand request,
        CancellationToken cancellationToken)
    {
        var ctx = await current.ResolveAsync();

        var hoSoId = request.HoSoUngVienId;
        if (!hoSoId.HasValue)
        {
            hoSoId = await context.HoSoUngViens
                .AsNoTracking()
                .Where(x => x.NguoiDungId == ctx.Id)
                .Select(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);
            if (hoSoId == 0)
            {
                return new Response<int>(
                    "Bạn chưa có hồ sơ ứng viên.");
            }
        }
        else if (ctx.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN)
        {
            var laCuaMinh = await context.HoSoUngViens
                .AsNoTracking()
                .AnyAsync(
                    x => x.Id == hoSoId.Value && x.NguoiDungId == ctx.Id,
                    cancellationToken);
            if (!laCuaMinh)
            {
                return new Response<int>(
                    "Bạn không có quyền thêm kỹ năng cho hồ sơ này.");
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

        var daTonTai = await context.KyNangUngViens
            .AsNoTracking()
            .AnyAsync(
                x => x.HoSoUngVienId == hoSoId.Value &&
                     x.KyNangId == request.KyNangId,
                cancellationToken);

        if (daTonTai)
        {
            return new Response<int>(
                "Kỹ năng này đã có trong hồ sơ của bạn.");
        }

        var entity = new KyNangUngVienEntity
        {
            HoSoUngVienId = hoSoId.Value,
            KyNangId = request.KyNangId,
            SoNamKinhNghiem = request.SoNamKinhNghiem,
            MucDoThongThao = MucDo.CoBan
        };

        await context.KyNangUngViens.AddAsync(
            entity,
            cancellationToken);

        try
        {
            await context.SaveChangesAsync(
                cancellationToken);
        }
        catch (DbUpdateException)
        {
            // Unique (HoSoUngVienId, KyNangId): 2 request đồng thời lọt qua check.
            return new Response<int>(
                "Kỹ năng này đã có trong hồ sơ của bạn.");
        }

        return new Response<int>(
            data: entity.Id,
            message: "Thêm kỹ năng thành công.");
    }
}
