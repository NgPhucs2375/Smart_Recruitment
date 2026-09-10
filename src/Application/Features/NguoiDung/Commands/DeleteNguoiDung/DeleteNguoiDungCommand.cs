using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.NguoiDung.Commands.DeleteNguoiDung
{
    public class DeleteNguoiDungCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
    }

    public class DeleteNguoiDungCommandHandler : IRequestHandler<DeleteNguoiDungCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public DeleteNguoiDungCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(DeleteNguoiDungCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.NguoiDungs.FindAsync(request.Id);
            if (entity == null)
                return new Response<int>("Không tìm thấy người dùng.");

            _context.NguoiDungs.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Xóa người dùng thành công.");
        }
    }
}
