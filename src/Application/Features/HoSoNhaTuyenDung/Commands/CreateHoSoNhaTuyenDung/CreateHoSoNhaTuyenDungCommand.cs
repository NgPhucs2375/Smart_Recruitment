using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.HoSoNhaTuyenDung.Commands.CreateHoSoNhaTuyenDung
{
    public class CreateHoSoNhaTuyenDungCommand : IRequest<Response<int>>
    {
        public int NguoiDungId { get; set; }
        public int DoanhNghiepId { get; set; }
        public string HoTen { get; set; }
        public string SDT { get; set; }
        public string ChucVu { get; set; }
    }

    public class CreateHoSoNhaTuyenDungCommandHandler : IRequestHandler<CreateHoSoNhaTuyenDungCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public CreateHoSoNhaTuyenDungCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(CreateHoSoNhaTuyenDungCommand request, CancellationToken cancellationToken)
        {
            var entity = new Domain.Entities.HoSoNhaTuyenDung
            {
                NguoiDungId = request.NguoiDungId,
                DoanhNghiepId = request.DoanhNghiepId,
                HoTen = request.HoTen,
                SDT = request.SDT,
                ChucVu = request.ChucVu
            };

            await _context.HoSoNhaTuyenDungs.AddAsync(entity, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Tạo hồ sơ nhà tuyển dụng thành công.");
        }
    }
}
