using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.HoSoUngVien.Commands.UpdateHoSoUngVien
{
    public class UpdateHoSoUngVienCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
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

    public class UpdateHoSoUngVienCommandHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current)
        : IRequestHandler<UpdateHoSoUngVienCommand, Response<int>>
    {
        public async Task<Response<int>> Handle(
            UpdateHoSoUngVienCommand request,
            CancellationToken cancellationToken)
        {
            var entity = await context.HoSoUngViens
                .FindAsync([request.Id], cancellationToken);

            if (entity == null)
            {
                return new Response<int>(
                    "Không tìm thấy hồ sơ ứng viên.");
            }

            var ctx = await current.ResolveAsync();

            if (ctx.VaiTro == VaiTroNguoiDung.UNG_VIEN &&
                entity.NguoiDungId != ctx.Id)
            {
                return new Response<int>(
                    "Bạn chỉ được sửa hồ sơ của chính mình.");
            }

            entity.HoTen = request.HoTen?.Trim();
            entity.SDT = request.SDT?.Trim();
            entity.NgaySinh = request.NgaySinh;
            entity.GioiTinh = request.GioiTinh?.Trim();
            entity.DiaChi = request.DiaChi?.Trim();
            entity.GioiThieu = request.GioiThieu?.Trim();
            entity.ViTriUngTuyen = request.ViTriUngTuyen?.Trim();
            entity.MucLuongMongMuon = request.MucLuongMongMuon;
            entity.IsTimViec = request.IsTimViec;

            await context.SaveChangesAsync(
                cancellationToken);

            return new Response<int>(
                data: entity.Id,
                message: "Cập nhật hồ sơ ứng viên thành công.");
        }
    }
}
