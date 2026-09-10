using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KinhNghiemLamViec.Commads.DeleteKinhNghiemLamViec
{
    public class DeleteKinhNghiemLamViecByIdCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
    }

    public class DeleteKinhNghiemLamViecByIdCommandHandler : IRequestHandler<DeleteKinhNghiemLamViecByIdCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public DeleteKinhNghiemLamViecByIdCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(DeleteKinhNghiemLamViecByIdCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.KinhNghiemLamViecs.FindAsync(request.Id);
            if (entity == null)
                return new Response<int>("Khong tim thay kinh nghiem lam viec.");

            _context.KinhNghiemLamViecs.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Xoa kinh nghiem lam viec thanh cong.");
        }
    }
}
