using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;


namespace Application.Features.KyNangUngVien.Commads.UpdateKyNangUngVien
{
    public class UpdateKyNangUngVienCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
        public int HoSoUngVienId { get; set; }
        public int KyNangId { get; set; }
        public float? SoNamKinhNghiem { get; set; }
    }

    public class UpdateKyNangUngVienCommandHandler : IRequestHandler<UpdateKyNangUngVienCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public UpdateKyNangUngVienCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(UpdateKyNangUngVienCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.KyNangUngViens.FindAsync(request.Id);
            if (entity == null)
                return new Response<int>("Khong tim thay ky nang ung vien.");

            entity.HoSoUngVienId = request.HoSoUngVienId;
            entity.KyNangId = request.KyNangId;
            entity.SoNamKinhNghiem = request.SoNamKinhNghiem;

            await _context.SaveChangesAsync(cancellationToken);
            return new Response<int>(data: entity.Id, message: "Cap nhat ky nang ung vien thanh cong.");
        }
    }
}
