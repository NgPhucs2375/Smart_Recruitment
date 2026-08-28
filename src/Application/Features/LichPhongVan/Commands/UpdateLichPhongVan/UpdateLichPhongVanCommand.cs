using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.LichPhongVan.Commands.UpdateLichPhongVan
{
    public class UpdateLichPhongVanCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }
        public int DonUngTuyenId { get; set; }
        public string DiaDiem { get; set; }
        public string GhiChu { get; set; }
        public HinhThucPhongVan HinhThuc { get; set; }
        public DateTime? ThoiGianPhongVan { get; set; }
        public TrangThaiLichPhongVan TrangThai { get; set; }
    }

    public class UpdateLichPhongVanCommandHandler : IRequestHandler<UpdateLichPhongVanCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        public UpdateLichPhongVanCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<int>> Handle(UpdateLichPhongVanCommand request, CancellationToken cancellationToken)
        {
            var entity = await _context.LichPhongVans.FindAsync(request.Id);
            if (entity == null)
                return new Response<int>("Không tìm thấy lịch phỏng vấn.");

            entity.DonUngTuyenId = request.DonUngTuyenId;
            entity.DiaDiem = request.DiaDiem;
            entity.GhiChu = request.GhiChu;
            entity.HinhThuc = request.HinhThuc;
            entity.ThoiGianPhongVan = request.ThoiGianPhongVan;
            entity.TrangThai = request.TrangThai;

            await _context.SaveChangesAsync(cancellationToken);

            return new Response<int>(data: entity.Id, message: "Cập nhật lịch phỏng vấn thành công.");
        }
    }
}
