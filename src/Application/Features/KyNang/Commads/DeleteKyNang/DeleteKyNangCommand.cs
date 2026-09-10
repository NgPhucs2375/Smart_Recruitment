using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KyNang.Commads.DeleteKyNang
{
    public class DeleteKyNangByIdCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
    }

    public class DeleteKyNangByIdCommandHandler : IRequestHandler<DeleteKyNangByIdCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public DeleteKyNangByIdCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(DeleteKyNangByIdCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.KyNangs.FindAsync(request.Id);
            if (entity == null)
                return new Response<int>("Khong tim thay ky nang.");

            _context.KyNangs.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Xoa ky nang thanh cong.");
        }
    }
}
