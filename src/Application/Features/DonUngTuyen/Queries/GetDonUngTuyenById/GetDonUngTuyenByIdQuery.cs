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

    public class GetDonUngTuyenByIdQueryHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current)
        : IRequestHandler<GetDonUngTuyenByIdQuery, Response<GetAllDonUngTuyens.GetAllDonUngTuyensViewModel>>
    {
        public async Task<Response<GetAllDonUngTuyens.GetAllDonUngTuyensViewModel>> Handle(
            GetDonUngTuyenByIdQuery request,
            CancellationToken cancellationToken)
        {
            var entity = await context.DonUngTuyens
                .Include(d => d.TinTuyenDung)
                .Include(d => d.CVUngVien).ThenInclude(cv => cv.HoSoUngVien)
                .FirstOrDefaultAsync(
                    d => d.Id == request.Id,
                    cancellationToken);

            if (entity == null)
            {
                return new Response<GetAllDonUngTuyens.GetAllDonUngTuyensViewModel>(
                    "Không tìm thấy đơn ứng tuyển.");
            }

            var ctx = await current.ResolveAsync();

            var accessible = ctx.VaiTro == VaiTroNguoiDung.UNG_VIEN
                ? entity.CVUngVien != null &&
                  entity.CVUngVien.HoSoUngVien != null &&
                  entity.CVUngVien.HoSoUngVien.NguoiDungId == ctx.Id
                : ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN
                    ? entity.TinTuyenDung.DoanhNghiepId == ctx.DoanhNghiepId
                    : ctx.VaiTro == VaiTroNguoiDung.NHAN_SU &&
                      entity.TinTuyenDung.NguoiDangTinId == ctx.Id;

            if (!accessible)
            {
                throw new ApiException(
                    "Bạn không có quyền xem đơn ứng tuyển này.", 403);
            }

            var vm = new GetAllDonUngTuyens.GetAllDonUngTuyensViewModel
            {
                Id = entity.Id,
                HoSoUngVienId = entity.CVUngVien != null
                    ? entity.CVUngVien.HoSoUngVienId
                    : 0,
                TinTuyenDungId = entity.TinTuyenDungId,
                CVUngVienId = entity.CVUngVienId,
                TrangThai = entity.TrangThai,
                GhiChu = entity.GhiChu
            };

            return new Response<GetAllDonUngTuyens.GetAllDonUngTuyensViewModel>(vm);
        }
    }
}
