using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.ThongBao.Commands.DeleteThongBao
{
    public class DeleteThongBaoCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
    }

    public class DeleteThongBaoCommandHandler : IRequestHandler<DeleteThongBaoCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public DeleteThongBaoCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(DeleteThongBaoCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.ThongBaos.FindAsync(request.Id);
            if (entity == null)
                return new Response<int>("Không tìm thấy thông báo.");

            _context.ThongBaos.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Xóa thông báo thành công.");
        }
    }
}
