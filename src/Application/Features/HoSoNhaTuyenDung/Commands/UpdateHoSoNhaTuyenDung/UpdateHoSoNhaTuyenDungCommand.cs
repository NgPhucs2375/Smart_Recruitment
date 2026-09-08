using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.HoSoNhaTuyenDung.Commands.UpdateHoSoNhaTuyenDung
{
    public class UpdateHoSoNhaTuyenDungCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
        public int NguoiDungId { get; set; }
        public int DoanhNghiepId { get; set; }
        public string HoTen { get; set; }
        public string SDT { get; set; }
        public string ChucVu { get; set; }
    }

    public class UpdateHoSoNhaTuyenDungCommandHandler : IRequestHandler<UpdateHoSoNhaTuyenDungCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public UpdateHoSoNhaTuyenDungCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(UpdateHoSoNhaTuyenDungCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.HoSoNhaTuyenDungs.FindAsync(request.Id);
            if (entity == null)
                return new Response<int>("Không tìm thấy hồ sơ nhà tuyển dụng.");

            entity.NguoiDungId = request.NguoiDungId;
            entity.DoanhNghiepId = request.DoanhNghiepId;
            entity.HoTen = request.HoTen;
            entity.SDT = request.SDT;
            entity.ChucVu = request.ChucVu;

            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Cập nhật hồ sơ nhà tuyển dụng thành công.");
        }
    }
}
