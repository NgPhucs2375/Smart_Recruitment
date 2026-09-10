using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;


namespace Application.Features.KyNangUngVien.Commads.CreateKyNangUngVien
{
    public class CreateKyNangUngVienCommand : IRequest<Response<int>>
    {
        public int HoSoUngVienId { get; set; }
        public int KyNangId { get; set; }
        public float? SoNamKinhNghiem { get; set; }
    }

    public class CreateKyNangUngVienCommandHandler : IRequestHandler<CreateKyNangUngVienCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public CreateKyNangUngVienCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(CreateKyNangUngVienCommand request, CancellationToken cancellationToken)
        {
            var exists = await _context.KyNangUngViens.AnyAsync(
                x => x.HoSoUngVienId == request.HoSoUngVienId && x.KyNangId == request.KyNangId,
                cancellationToken);

            if (exists)
            {
                return new Response<int>("Ky nang nay da ton tai trong ho so ung vien.");
            }

            var entity = new Domain.Entities.KyNangUngVien
            {
                HoSoUngVienId = request.HoSoUngVienId,
                KyNangId = request.KyNangId,
                SoNamKinhNghiem = request.SoNamKinhNghiem
            };

            await _context.KyNangUngViens.AddAsync(entity, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Tao ky nang ung vien thanh cong.");
        }
    }
}
