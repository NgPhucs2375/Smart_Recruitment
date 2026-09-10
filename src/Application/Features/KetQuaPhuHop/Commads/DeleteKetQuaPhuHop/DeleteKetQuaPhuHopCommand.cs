using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KetQuaPhuHop.Commads.DeleteKetQuaPhuHop
{
    public class DeleteKetQuaPhuHopByIdCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
    }

    public class DeleteKetQuaPhuHopByIdCommandHandler : IRequestHandler<DeleteKetQuaPhuHopByIdCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public DeleteKetQuaPhuHopByIdCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(DeleteKetQuaPhuHopByIdCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.KetQuaPhuHops.FindAsync(request.Id);
            if (entity == null)
                return new Response<int>("Khong tim thay ket qua phu hop.");

            _context.KetQuaPhuHops.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Xoa ket qua phu hop thanh cong.");
        }
    }
}
