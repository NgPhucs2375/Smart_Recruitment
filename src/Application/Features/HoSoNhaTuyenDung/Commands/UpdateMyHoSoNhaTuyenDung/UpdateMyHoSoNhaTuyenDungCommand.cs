using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.HoSoNhaTuyenDung.Commands.UpdateMyHoSoNhaTuyenDung;

/// <summary>
/// Nhân sự / Người đại diện tự cập nhật hồ sơ cá nhân của mình.
/// Chỉ các trường thông tin (HoTen/SDT/ChucVu) — liên kết NguoiDungId,
/// DoanhNghiepId tuyệt đối không đổi qua đường này.
/// </summary>
public class UpdateMyHoSoNhaTuyenDungCommand : IRequest<Response<int>>
{
    public string HoTen { get; set; }

    public string SDT { get; set; }

    public string ChucVu { get; set; }
}

public class UpdateMyHoSoNhaTuyenDungCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<UpdateMyHoSoNhaTuyenDungCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        UpdateMyHoSoNhaTuyenDungCommand request,
        CancellationToken cancellationToken)
    {
        var ctx = await current.ResolveAsync();

        var query = context.HoSoNhaTuyenDungs
            .Where(x => x.NguoiDungId == ctx.Id);

        var entity = ctx.DoanhNghiepId.HasValue
            ? await query
                .OrderByDescending(x => x.DoanhNghiepId == ctx.DoanhNghiepId.Value)
                .ThenBy(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken)
            : await query
                .OrderBy(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);

        if (entity == null)
        {
            return new Response<int>(
                "Bạn chưa có hồ sơ nhà tuyển dụng.");
        }

        // DbContext NoTracking toàn cục: Find/FirstOrDefault trả về entity
        // không track — Attach cùng reference (không throw duplicate-track).
        context.HoSoNhaTuyenDungs.Attach(entity);

        entity.HoTen = request.HoTen?.Trim();
        entity.SDT = request.SDT?.Trim();
        entity.ChucVu = request.ChucVu?.Trim();

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Cập nhật hồ sơ thành công.");
    }
}
