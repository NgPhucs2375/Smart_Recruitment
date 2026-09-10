using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using HoSoUngVienEntity = global::Domain.Entities.HoSoUngVien;

namespace Application.Features.HoSoUngVien.Commands.CreateHoSoUngVien;

public class CreateHoSoUngVienCommand : IRequest<Response<int>>
{
    public int NguoiDungId { get; set; }

    public string HoTen { get; set; }

    public string SDT { get; set; }

    public DateTime? NgaySinh { get; set; }

    public string GioiTinh { get; set; }

    public string DiaChi { get; set; }

    public string GioiThieu { get; set; }

    public string ViTriUngTuyen { get; set; }

    public double MucLuongMongMuon { get; set; }

    public bool IsTimViec { get; set; } = true;
}

public class CreateHoSoUngVienCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService current)
    : IRequestHandler<CreateHoSoUngVienCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        CreateHoSoUngVienCommand request,
        CancellationToken cancellationToken)
    {
        var ctx = await current.ResolveAsync();

        int nguoiDungId;

        if (ctx.VaiTro == VaiTroNguoiDung.UNG_VIEN)
        {
            // Ứng viên chỉ được tạo hồ sơ cho chính mình.
            nguoiDungId = ctx.Id;
        }
        else if (ctx.VaiTro == VaiTroNguoiDung.QUAN_TRI_VIEN)
        {
            if (request.NguoiDungId <= 0)
            {
                return new Response<int>(
                    "Người dùng không hợp lệ.");
            }

            nguoiDungId = request.NguoiDungId;
        }
        else
        {
            return new Response<int>(
                "Bạn không có quyền tạo hồ sơ ứng viên.");
        }

        var nguoiDung = await context.NguoiDungs
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == nguoiDungId,
                cancellationToken);

        if (nguoiDung == null)
        {
            return new Response<int>(
                "Người dùng không tồn tại.");
        }

        if (nguoiDung.VaiTro != VaiTroNguoiDung.UNG_VIEN)
        {
            return new Response<int>(
                "Người dùng không phải là ứng viên.");
        }

        var existed = await context.HoSoUngViens
            .AsNoTracking()
            .AnyAsync(
                x => x.NguoiDungId == nguoiDungId,
                cancellationToken);

        if (existed)
        {
            return new Response<int>(
                "Người dùng đã có hồ sơ ứng viên.");
        }

        var entity = new HoSoUngVienEntity
        {
            NguoiDungId = nguoiDungId,

            HoTen = request.HoTen?.Trim(),

            SDT = request.SDT?.Trim(),

            NgaySinh = request.NgaySinh,

            GioiTinh = request.GioiTinh?.Trim(),

            DiaChi = request.DiaChi?.Trim(),

            GioiThieu = request.GioiThieu?.Trim(),

            ViTriUngTuyen = request.ViTriUngTuyen?.Trim(),

            MucLuongMongMuon = request.MucLuongMongMuon,

            IsTimViec = request.IsTimViec
        };

        await context.HoSoUngViens.AddAsync(
            entity,
            cancellationToken);

        await context.SaveChangesAsync(
            cancellationToken);

        return new Response<int>(
            data: entity.Id,
            message: "Tạo hồ sơ ứng viên thành công.");
    }
}