using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;
using Domain.Enums;

namespace Application.Features.KetQuaPhuHop.Commads.UpdateKetQuaPhuHop
{
    public class UpdateKetQuaPhuHopCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
        public int HoSoUngVienId { get; set; }
        public int TinTuyenDungId { get; set; }
        public float DiemPhuHop { get; set; }
        public PhanLoaiKetQua PhanLoai { get; set; }
    }

    public class UpdateKetQuaPhuHopCommandHandler : IRequestHandler<UpdateKetQuaPhuHopCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public UpdateKetQuaPhuHopCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(UpdateKetQuaPhuHopCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.KetQuaPhuHops.FindAsync(request.Id);
            if (entity == null)
                return new Response<int>("Khong tim thay ket qua phu hop.");

            entity.HoSoUngVienId = request.HoSoUngVienId;
            entity.TinTuyenDungId = request.TinTuyenDungId;
            entity.DiemPhuHop = request.DiemPhuHop;
            entity.PhanLoai = request.PhanLoai;

            await _context.SaveChangesAsync(cancellationToken);
            return new Response<int>(data: entity.Id, message: "Cap nhat ket qua phu hop thanh cong.");
        }
    }
}
