using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.HoSoNhaTuyenDung.Commands.DeleteHoSoNhaTuyenDung
{
    public class DeleteHoSoNhaTuyenDungCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
    }

    public class DeleteHoSoNhaTuyenDungCommandHandler : IRequestHandler<DeleteHoSoNhaTuyenDungCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public DeleteHoSoNhaTuyenDungCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(DeleteHoSoNhaTuyenDungCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.HoSoNhaTuyenDungs.FindAsync(request.Id);
            if (entity == null)
                return new Response<int>("Không tìm thấy hồ sơ nhà tuyển dụng.");

            _context.HoSoNhaTuyenDungs.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Xóa hồ sơ nhà tuyển dụng thành công.");
        }
    }
}
