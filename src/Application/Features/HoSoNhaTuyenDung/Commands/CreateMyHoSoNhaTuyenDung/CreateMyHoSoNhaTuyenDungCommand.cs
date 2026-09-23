using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using HoSoNhaTuyenDungEntity = global::Domain.Entities.HoSoNhaTuyenDung;

namespace Application.Features.HoSoNhaTuyenDung.Commands.CreateMyHoSoNhaTuyenDung;

/// <summary>
/// Self-service: người đại diện tự tạo hồ sơ nhà tuyển dụng cho chính mình
/// khi tài khoản chưa gắn hồ sơ nào (VD: tài khoản được seed trực tiếp,
/// bỏ qua luồng đăng ký doanh nghiệp). Doanh nghiệp lấy từ ngữ cảnh hiện tại
/// (DN mà họ là người đại diện). Không cho phép trùng hồ sơ.
/// </summary>
public class CreateMyHoSoNhaTuyenDungCommand : IRequest<Response<int>>
{
    public string HoTen { get; set; }

    public string SDT { get; set; }

    public string ChucVu { get; set; }
}

public class CreateMyHoSoNhaTuyenDungCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<CreateMyHoSoNhaTuyenDungCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        CreateMyHoSoNhaTuyenDungCommand request,
        CancellationToken cancellationToken)
    {
        var ctx = await current.ResolveAsync();

        if (ctx.VaiTro != VaiTroNguoiDung.NGUOI_DAI_DIEN)
        {
            return new Response<int>(
                "Chỉ người đại diện mới được tự tạo hồ sơ nhà tuyển dụng.");
        }

        if (!ctx.DoanhNghiepId.HasValue)
        {
            return new Response<int>(
                "Bạn chưa có doanh nghiệp. Vui lòng tạo doanh nghiệp trước.");
        }

        // Tránh một user có nhiều hồ sơ trong cùng doanh nghiệp.
        var daTonTai = await context.HoSoNhaTuyenDungs
            .AsNoTracking()
            .AnyAsync(
                x => x.NguoiDungId == ctx.Id &&
                     x.DoanhNghiepId == ctx.DoanhNghiepId.Value,
                cancellationToken);

        if (daTonTai)
        {
            return new Response<int>(
                "Bạn đã có hồ sơ trong doanh nghiệp này.");
        }

        var entity = new HoSoNhaTuyenDungEntity
        {
            NguoiDungId = ctx.Id,
            DoanhNghiepId = ctx.DoanhNghiepId.Value,
            HoTen = request.HoTen?.Trim(),
            SDT = request.SDT?.Trim(),
            ChucVu = request.ChucVu?.Trim()
        };

        await context.HoSoNhaTuyenDungs.AddAsync(
            entity,
            cancellationToken);

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Tạo hồ sơ nhà tuyển dụng thành công.");
    }
}
