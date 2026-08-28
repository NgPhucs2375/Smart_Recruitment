using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.LichPhongVan.Commands.DeleteLichPhongVan
{
    public class DeleteLichPhongVanCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
    }

    public class DeleteLichPhongVanCommandHandler : IRequestHandler<DeleteLichPhongVanCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public DeleteLichPhongVanCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(DeleteLichPhongVanCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.LichPhongVans.FindAsync(request.Id);
            if (entity == null)
                return new Response<int>("Không tìm thấy lịch phỏng vấn.");

            _context.LichPhongVans.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Xóa lịch phỏng vấn thành công.");
        }
    }
}
