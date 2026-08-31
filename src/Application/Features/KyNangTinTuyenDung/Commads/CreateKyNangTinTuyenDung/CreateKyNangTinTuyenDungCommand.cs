using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;


namespace Application.Features.KyNangTinTuyenDung.Commads.CreateKyNangTinTuyenDung
{
    public class CreateKyNangTinTuyenDungCommand : IRequest<Response<int>>
    {
        public int TinTuyenDungId { get; set; }
        public int KyNangId { get; set; }
        public string MucDoYeuCau { get; set; }
    }

    public class CreateKyNangTinTuyenDungCommandHandler : IRequestHandler<CreateKyNangTinTuyenDungCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public CreateKyNangTinTuyenDungCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(CreateKyNangTinTuyenDungCommand request, CancellationToken cancellationToken)
        {
            if (await _context.KyNangTinTuyenDungs.AnyAsync(
                x => x.TinTuyenDungId == request.TinTuyenDungId && x.KyNangId == request.KyNangId,
                cancellationToken))
            {
                return new Response<int>("Ky nang nay da ton tai trong tin tuyen dung.");
            }

            var entity = new Domain.Entities.KyNangTinTuyenDung
            {
                TinTuyenDungId = request.TinTuyenDungId,
                KyNangId = request.KyNangId,
                MucDoYeuCau = request.MucDoYeuCau
            };

            await _context.KyNangTinTuyenDungs.AddAsync(entity, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Tao ky nang tin tuyen dung thanh cong.");
        }
    }
}
