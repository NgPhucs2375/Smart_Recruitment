using Application.Exceptions;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.TinTuyenDung.Queries.GetTinTuyenDungById
{
    public class GetTinTuyenDungByIdQuery : IRequest<Response<GetAllTinTuyenDungs.GetAllTinTuyenDungsViewModel>>
    {
        public int Id { get; set; }
    }

    public class GetTinTuyenDungByIdQueryHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current)
        : IRequestHandler<GetTinTuyenDungByIdQuery, Response<GetAllTinTuyenDungs.GetAllTinTuyenDungsViewModel>>
    {
        public async Task<Response<GetAllTinTuyenDungs.GetAllTinTuyenDungsViewModel>> Handle(
            GetTinTuyenDungByIdQuery request,
            CancellationToken cancellationToken)
        {
            var entity = await context.TinTuyenDungs
                .FindAsync([request.Id], cancellationToken);

            if (entity == null)
            {
                return new Response<GetAllTinTuyenDungs.GetAllTinTuyenDungsViewModel>(
                    "Không tìm thấy tin tuyển dụng.");
            }

            var ctx = await current.ResolveAsync();

            var accessible = ctx.VaiTro == VaiTroNguoiDung.UNG_VIEN
                ? entity.TrangThai == TrangThaiTinTuyenDung.DangTuyen
                : ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN
                    ? entity.DoanhNghiepId == ctx.DoanhNghiepId
                    : ctx.VaiTro == VaiTroNguoiDung.NHAN_SU &&
                      entity.NguoiDangTinId == ctx.Id;

            if (!accessible)
            {
                throw new ApiException(
                    "Bạn không có quyền xem tin tuyển dụng này.", 403);
            }

            var vm = new GetAllTinTuyenDungs.GetAllTinTuyenDungsViewModel
            {
                Id = entity.Id,
                TieuDe = entity.TieuDe,
                DiaDiemLamViec = entity.DiaDiemLamViec,
                LuongToiThieu = entity.LuongToiThieu,
                LuongToiDa = entity.LuongToiDa,
                TrangThai = entity.TrangThai.ToString(),
                NgayHetHan = entity.NgayHetHan,
                NguoiDangTinId = entity.NguoiDangTinId,
                DoanhNghiepId = entity.DoanhNghiepId
            };

            return new Response<GetAllTinTuyenDungs.GetAllTinTuyenDungsViewModel>(vm);
        }
    }
}
