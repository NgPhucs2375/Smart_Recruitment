using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KyNangTinTuyenDung.Commads.DeleteKyNangTinTuyenDung
{
    public class DeleteKyNangTinTuyenDungByIdCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
    }

    public class DeleteKyNangTinTuyenDungByIdCommandHandler : IRequestHandler<DeleteKyNangTinTuyenDungByIdCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public DeleteKyNangTinTuyenDungByIdCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(DeleteKyNangTinTuyenDungByIdCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.KyNangTinTuyenDungs.FindAsync(request.Id);
            if (entity == null)
                return new Response<int>("Khong tim thay ky nang tin tuyen dung.");

            _context.KyNangTinTuyenDungs.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Xoa ky nang tin tuyen dung thanh cong.");
        }
    }
}
