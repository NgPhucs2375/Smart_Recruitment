using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;
using System;

namespace Application.Features.KinhNghiemLamViec.Commads.CreateKinhNghiemLamViec
{
    public class CreateKinhNghiemLamViecCommand : IRequest<Response<int>>
    {
        public int HoSoUngVienId { get; set; }
        public string TenCongTy { get; set; }
        public string DiaChi { get; set; }
        public DateTime? TuNgay { get; set; }
        public DateTime? DenNgay { get; set; }
        public string MoTa { get; set; }
        public bool IsHienTai { get; set; }
    }

    public class CreateKinhNghiemLamViecCommandHandler : IRequestHandler<CreateKinhNghiemLamViecCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public CreateKinhNghiemLamViecCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(CreateKinhNghiemLamViecCommand request, CancellationToken cancellationToken)
        {
            var entity = new Domain.Entities.KinhNghiemLamViec
            {
                HoSoUngVienId = request.HoSoUngVienId,
                TenCongTy = request.TenCongTy,
                DiaChi = request.DiaChi,
                TuNgay = request.TuNgay,
                DenNgay = request.DenNgay,
                MoTa = request.MoTa,
                IsHienTai = request.IsHienTai
            };

            await _context.KinhNghiemLamViecs.AddAsync(entity, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Tao kinh nghiem lam viec thanh cong.");
        }
    }
}
