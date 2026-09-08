using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.HoSoUngVien.Commads.UpdateHoSoUngVien
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
    }

    public class UpdateHoSoUngVienCommandHandler : IRequestHandler<UpdateHoSoUngVienCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public UpdateHoSoUngVienCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(UpdateHoSoUngVienCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.HoSoUngViens.FindAsync(request.Id);
            if (entity == null)
                return new Response<int>("Không tìm thấy hồ sơ ứng viên.");

            entity.HoTen = request.HoTen;
            entity.SDT = request.SDT;
            entity.NgaySinh = request.NgaySinh;
            entity.GioiTinh = request.GioiTinh;
            entity.DiaChi = request.DiaChi;
            entity.GioiThieu = request.GioiThieu;

            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Cập nhật hồ sơ ứng viên thành công.");
        }
    }
}
