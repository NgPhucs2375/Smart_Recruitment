using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;


namespace Application.Features.KyNang.Commads.UpdateKyNang
{
    public class UpdateKyNangCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
        public string TenKyNang { get; set; }
        public string MoTa { get; set; }
    }

    public class UpdateKyNangCommandHandler : IRequestHandler<UpdateKyNangCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public UpdateKyNangCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(UpdateKyNangCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.KyNangs.FindAsync(request.Id);
            if (entity == null)
                return new Response<int>("Khong tim thay ky nang.");

            entity.TenKyNang = request.TenKyNang;
            entity.MoTa = request.MoTa;

            await _context.SaveChangesAsync(cancellationToken);
            return new Response<int>(data: entity.Id, message: "Cap nhat ky nang thanh cong.");
        }
    }
}
