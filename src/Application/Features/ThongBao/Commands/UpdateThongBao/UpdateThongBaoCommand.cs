using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.ThongBao.Commands.UpdateThongBao
{
    public class UpdateThongBaoCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
        public int NguoiDungId { get; set; }
        public string TieuDe { get; set; }
        public string NoiDung { get; set; }
        public LoaiThongBao LoaiThongBao { get; set; }
        public bool IsRead { get; set; }
    }

    public class UpdateThongBaoCommandHandler : IRequestHandler<UpdateThongBaoCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public UpdateThongBaoCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(UpdateThongBaoCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.ThongBaos.FindAsync(request.Id);
            if (entity == null)
                return new Response<int>("Không tìm thấy thông báo.");

            entity.NguoiDungId = request.NguoiDungId;
            entity.TieuDe = request.TieuDe;
            entity.NoiDung = request.NoiDung;
            entity.LoaiThongBao = request.LoaiThongBao;
            entity.IsRead = request.IsRead;

            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Cập nhật thông báo thành công.");
        }
    }
}
