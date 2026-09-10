using Application.Exceptions;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.DonUngTuyen.Queries.GetDonUngTuyenById
{
    public class GetDonUngTuyenByIdQuery : IRequest<Response<GetAllDonUngTuyens.GetAllDonUngTuyensViewModel>>
    {
        public int Id { get; set; }
    }

    public class GetDonUngTuyenByIdQueryHandler : IRequestHandler<GetDonUngTuyenByIdQuery, Response<GetAllDonUngTuyens.GetAllDonUngTuyensViewModel>>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentNguoiDungService _current;

        public GetDonUngTuyenByIdQueryHandler(IApplicationDbContext context, ICurrentNguoiDungService current)
        {
            _context = context;
            _current = current;
        }

        public async Task<Response<GetAllDonUngTuyens.GetAllDonUngTuyensViewModel>> Handle(GetDonUngTuyenByIdQuery q, CancellationToken ct)
        {
            var entity = await _context.DonUngTuyens
                .Include(d => d.TinTuyenDung)
                .Include(d => d.HoSoUngVien)
                .FirstOrDefaultAsync(d => d.Id == q.Id, ct);
            if (entity == null)
                return new Response<GetAllDonUngTuyens.GetAllDonUngTuyensViewModel>("Không tìm thấy đơn ứng tuyển.");

            var ctx = await _current.ResolveAsync();
            bool accessible = ctx.VaiTro == VaiTroNguoiDung.UNG_VIEN
                ? entity.HoSoUngVien.NguoiDungId == ctx.Id
                : (ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN
                    ? entity.TinTuyenDung.DoanhNghiepId == ctx.DoanhNghiepId
                    : (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU ? entity.TinTuyenDung.NguoiDangTinId == ctx.Id : false));
            if (!accessible)
                throw new ApiException("Bạn không có quyền xem đơn ứng tuyển này.", 403);

            var vm = new GetAllDonUngTuyens.GetAllDonUngTuyensViewModel
            {
                Id = entity.Id,
                HoSoUngVienId = entity.HoSoUngVienId,
                TinTuyenDungId = entity.TinTuyenDungId,
                TrangThai = entity.TrangThai,
                GhiChu = entity.GhiChu
            };
            return new Response<GetAllDonUngTuyens.GetAllDonUngTuyensViewModel>(vm);
        }
    }
}
