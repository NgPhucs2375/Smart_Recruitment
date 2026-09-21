using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KyNangUngVien.Queries.GetKyNangUngVienById
{
    public class GetKyNangUngVienByIdQuery : IRequest<Response<GetAllKyNangUngViens.GetAllKyNangUngViensViewModel>>
    {
        public int Id { get; set; }
    }

    public class GetKyNangUngVienByIdQueryHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current)
        : IRequestHandler<GetKyNangUngVienByIdQuery, Response<GetAllKyNangUngViens.GetAllKyNangUngViensViewModel>>
    {
        public async Task<Response<GetAllKyNangUngViens.GetAllKyNangUngViensViewModel>> Handle(
            GetKyNangUngVienByIdQuery request,
            CancellationToken cancellationToken)
        {
            var entity = await context.KyNangUngViens
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.Id == request.Id,
                    cancellationToken);

            if (entity == null)
            {
                return new Response<GetAllKyNangUngViens.GetAllKyNangUngViensViewModel>(
                    "Không tìm thấy kỹ năng ứng viên.");
            }

            var ctx = await current.ResolveAsync();

            if (ctx.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN)
            {
                var laCuaMinh = await context.HoSoUngViens
                    .AsNoTracking()
                    .AnyAsync(
                        x => x.Id == entity.HoSoUngVienId && x.NguoiDungId == ctx.Id,
                        cancellationToken);
                if (!laCuaMinh)
                {
                    return new Response<GetAllKyNangUngViens.GetAllKyNangUngViensViewModel>(
                        "Bạn không có quyền xem kỹ năng này.");
                }
            }

            var tenKyNang = await context.KyNangs
                .AsNoTracking()
                .Where(x => x.Id == entity.KyNangId)
                .Select(x => x.TenKyNang)
                .FirstOrDefaultAsync(cancellationToken);

            return new Response<GetAllKyNangUngViens.GetAllKyNangUngViensViewModel>(
                new GetAllKyNangUngViens.GetAllKyNangUngViensViewModel
                {
                    Id = entity.Id,
                    HoSoUngVienId = entity.HoSoUngVienId,
                    KyNangId = entity.KyNangId,
                    TenKyNang = tenKyNang,
                    SoNamKinhNghiem = entity.SoNamKinhNghiem
                });
        }
    }
}
