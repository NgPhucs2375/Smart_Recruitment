using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.LichPhongVan.Commands.CreateLichPhongVan
{
    public class CreateLichPhongVanCommand : IRequest<Response<int>>
    {
        public int DonUngTuyenId { get; set; }
        public string DiaDiem { get; set; }
        public string GhiChu { get; set; }
        public HinhThucPhongVan HinhThuc { get; set; }
        public DateTime? ThoiGianPhongVan { get; set; }
        public TrangThaiLichPhongVan TrangThai { get; set; }
    }

    public class CreateLichPhongVanCommandHandler : IRequestHandler<CreateLichPhongVanCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public CreateLichPhongVanCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(CreateLichPhongVanCommand request, CancellationToken cancellationToken)
        {
            var entity = new Domain.Entities.LichPhongVan
            {
                DonUngTuyenId = request.DonUngTuyenId,
                DiaDiem = request.DiaDiem,
                GhiChu = request.GhiChu,
                HinhThuc = request.HinhThuc,
                ThoiGianPhongVan = request.ThoiGianPhongVan,
                TrangThai = request.TrangThai
            };

            await _context.LichPhongVans.AddAsync(entity, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Tạo lịch phỏng vấn thành công.");
        }
    }
}
