using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using System.Threading;
using System.Threading.Tasks;


namespace Application.Features.KyNangTinTuyenDung.Commads.UpdateKyNangTinTuyenDung
{
    public class UpdateKyNangTinTuyenDungCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
        public int TinTuyenDungId { get; set; }
        public int KyNangId { get; set; }
        public string MucDoYeuCau { get; set; }
    }

    public class UpdateKyNangTinTuyenDungCommandHandler : IRequestHandler<UpdateKyNangTinTuyenDungCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public UpdateKyNangTinTuyenDungCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(UpdateKyNangTinTuyenDungCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.KyNangTinTuyenDungs.FindAsync(request.Id);
            if (entity == null)
                return new Response<int>("Khong tim thay ky nang tin tuyen dung.");

            entity.TinTuyenDungId = request.TinTuyenDungId;
            entity.KyNangId = request.KyNangId;
            entity.MucDoYeuCau = request.MucDoYeuCau;

            await _context.SaveChangesAsync(cancellationToken);
            return new Response<int>(data: entity.Id, message: "Cap nhat ky nang tin tuyen dung thanh cong.");
        }
    }
}
