using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;
using System;

namespace Application.Features.KinhNghiemLamViec.Commads.UpdateKinhNghiemLamViec
{
    public class UpdateKinhNghiemLamViecCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
        public int HoSoUngVienId { get; set; }
        public string TenCongTy { get; set; }
        public string DiaChi { get; set; }
        public DateTime? TuNgay { get; set; }
        public DateTime? DenNgay { get; set; }
        public string MoTa { get; set; }
        public bool IsHienTai { get; set; }
    }

    public class UpdateKinhNghiemLamViecCommandHandler : IRequestHandler<UpdateKinhNghiemLamViecCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public UpdateKinhNghiemLamViecCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(UpdateKinhNghiemLamViecCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.KinhNghiemLamViecs.FindAsync(request.Id);
            if (entity == null)
                return new Response<int>("Khong tim thay kinh nghiem lam viec.");

            entity.HoSoUngVienId = request.HoSoUngVienId;
            entity.TenCongTy = request.TenCongTy;
            entity.DiaChi = request.DiaChi;
            entity.TuNgay = request.TuNgay;
            entity.DenNgay = request.DenNgay;
            entity.MoTa = request.MoTa;
            entity.IsHienTai = request.IsHienTai;

            await _context.SaveChangesAsync(cancellationToken);
            return new Response<int>(data: entity.Id, message: "Cap nhat kinh nghiem lam viec thanh cong.");
        }
    }
}
