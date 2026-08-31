using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;
using System;
using Domain.Enums;

namespace Application.Features.KetQuaPhuHop.Commads.CreateKetQuaPhuHop
{
    public class CreateKetQuaPhuHopCommand : IRequest<Response<int>>
    {
        public int HoSoUngVienId { get; set; }
        public int TinTuyenDungId { get; set; }
        public float DiemPhuHop { get; set; }
        public PhanLoaiKetQua PhanLoai { get; set; }
        public DateTime? NgayDanhGia { get; set; }
    }

    public class CreateKetQuaPhuHopCommandHandler : IRequestHandler<CreateKetQuaPhuHopCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public CreateKetQuaPhuHopCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(CreateKetQuaPhuHopCommand request, CancellationToken cancellationToken)
        {
            var entity = new Domain.Entities.KetQuaPhuHop
            {
                HoSoUngVienId = request.HoSoUngVienId,
                TinTuyenDungId = request.TinTuyenDungId,
                DiemPhuHop = request.DiemPhuHop,
                PhanLoai = request.PhanLoai,
                NgayDanhGia = request.NgayDanhGia
            };

            await _context.KetQuaPhuHops.AddAsync(entity, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Tao ket qua phu hop thanh cong.");
        }
    }
}
