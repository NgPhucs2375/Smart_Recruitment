using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.HoSoUngVien.Commands.CreateHoSoUngVien
{
    public class CreateHoSoUngVienCommand : IRequest<Response<int>>
    {
        public int NguoiDungId { get; set; }
        public string HoTen { get; set; }
        public string SDT { get; set; }
        public DateTime? NgaySinh { get; set; }
        public string GioiTinh { get; set; }
        public string DiaChi { get; set; }
        public string GioiThieu { get; set; }
    }

    public class CreateHoSoUngVienCommandHandler : IRequestHandler<CreateHoSoUngVienCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public CreateHoSoUngVienCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(CreateHoSoUngVienCommand request, CancellationToken cancellationToken)
        {
            var entity = new Domain.Entities.HoSoUngVien
            {
                NguoiDungId = request.NguoiDungId,
                HoTen = request.HoTen,
                SDT = request.SDT,
                NgaySinh = request.NgaySinh,
                GioiTinh = request.GioiTinh,
                DiaChi = request.DiaChi,
                GioiThieu = request.GioiThieu
            };

            await _context.HoSoUngViens.AddAsync(entity, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Tạo hồ sơ ứng viên thành công.");
        }
    }
}
