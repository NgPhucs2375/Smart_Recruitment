using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;


namespace Application.Features.KyNang.Commads.CreateKyNang
{
    public class CreateKyNangCommand : IRequest<Response<int>>
    {
        public string TenKyNang { get; set; }
        public string MoTa { get; set; }
    }

    public class CreateKyNangCommandHandler : IRequestHandler<CreateKyNangCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public CreateKyNangCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(CreateKyNangCommand request, CancellationToken cancellationToken)
        {
            var tenKyNang = request.TenKyNang?.Trim();

            if (await _context.KyNangs.AnyAsync(x => x.TenKyNang == tenKyNang, cancellationToken))
            {
                return new Response<int>("Ky nang nay da ton tai.");
            }

            var entity = new Domain.Entities.KyNang
            {
                TenKyNang = tenKyNang,
                MoTa = request.MoTa
            };

            await _context.KyNangs.AddAsync(entity, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Tao ky nang thanh cong.");
        }
    }
}
