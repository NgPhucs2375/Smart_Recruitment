using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.NguoiDung.Commands.CreateNguoiDung
{
    public class CreateNguoiDungCommand : IRequest<Response<int>>
    {
        public string ApplicationUserId { get; set; }
        public VaiTroNguoiDung VaiTro { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class CreateNguoiDungCommandHandler : IRequestHandler<CreateNguoiDungCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public CreateNguoiDungCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(CreateNguoiDungCommand request, CancellationToken cancellationToken)
        {
            var entity = new Domain.Entities.NguoiDung
            {
                ApplicationUserId = request.ApplicationUserId,
                VaiTro = request.VaiTro,
                IsActive = request.IsActive
            };

            await _context.NguoiDungs.AddAsync(entity, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Tạo người dùng thành công.");
        }
    }
}
