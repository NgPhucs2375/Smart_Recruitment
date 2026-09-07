using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KyNangUngVien.Commads.DeleteKyNangUngVien
{
    public class DeleteKyNangUngVienByIdCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
    }

    public class DeleteKyNangUngVienByIdCommandHandler : IRequestHandler<DeleteKyNangUngVienByIdCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public DeleteKyNangUngVienByIdCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(DeleteKyNangUngVienByIdCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.KyNangUngViens.FindAsync(request.Id);
            if (entity == null)
                return new Response<int>("Khong tim thay ky nang ung vien.");

            _context.KyNangUngViens.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Xoa ky nang ung vien thanh cong.");
        }
    }
}
