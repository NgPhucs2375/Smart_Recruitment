using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.HoSoUngVien.Commands.DeleteHoSoUngVien
{
    public class DeleteHoSoUngVienByIdCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
    }

    public class DeleteHoSoUngVienByIdCommandHandler : IRequestHandler<DeleteHoSoUngVienByIdCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public DeleteHoSoUngVienByIdCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(DeleteHoSoUngVienByIdCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.HoSoUngViens.FindAsync(request.Id);
            if (entity == null)
                return new Response<int>("Không tìm thấy hồ sơ ứng viên.");

            _context.HoSoUngViens.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Xóa hồ sơ ứng viên thành công.");
        }
    }
}
