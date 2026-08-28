using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.ThongBao.Commands.CreateThongBao
{
    public class CreateThongBaoCommand : IRequest<Response<int>>
    {
        public int NguoiDungId { get; set; }
        public string TieuDe { get; set; }
        public string NoiDung { get; set; }
        public LoaiThongBao LoaiThongBao { get; set; }
        public bool IsRead { get; set; } = false;
    }

    public class CreateThongBaoCommandHandler : IRequestHandler<CreateThongBaoCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public CreateThongBaoCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(CreateThongBaoCommand request, CancellationToken cancellationToken)
        {
            var entity = new Domain.Entities.ThongBao
            {
                NguoiDungId = request.NguoiDungId,
                TieuDe = request.TieuDe,
                NoiDung = request.NoiDung,
                LoaiThongBao = request.LoaiThongBao,
                IsRead = request.IsRead
            };

            await _context.ThongBaos.AddAsync(entity, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Tạo thông báo thành công.");
        }
    }
}
