using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.NguoiDung.Commands.UpdateNguoiDung
{
    public class UpdateNguoiDungCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
        public string ApplicationUserId { get; set; }
        public VaiTroNguoiDung VaiTro { get; set; }
        public bool IsActive { get; set; }
    }

    public class UpdateNguoiDungCommandHandler : IRequestHandler<UpdateNguoiDungCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public UpdateNguoiDungCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(UpdateNguoiDungCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.NguoiDungs.FindAsync(request.Id);
            if (entity == null)
                return new Response<int>("Không tìm thấy người dùng.");

            entity.ApplicationUserId = request.ApplicationUserId;
            entity.VaiTro = request.VaiTro;
            entity.IsActive = request.IsActive;

            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Cập nhật người dùng thành công.");
        }
    }
}
