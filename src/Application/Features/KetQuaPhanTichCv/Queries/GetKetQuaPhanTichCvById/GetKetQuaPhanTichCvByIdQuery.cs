using Application.Features.KetQuaPhanTichCv.Queries.GetAllKetQuaPhanTichCvs;
using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.KetQuaPhanTichCv.Queries.GetKetQuaPhanTichCvById;

public class GetKetQuaPhanTichCvByIdQuery : IRequest<Response<GetAllKetQuaPhanTichCvsViewModel>>
{
    public int Id { get; set; }
}

    public class GetKetQuaPhanTichCvByIdQueryHandler(
        IApplicationDbContext context,
        IMapper mapper,
        ICurrentNguoiDungService current)
        : IRequestHandler<GetKetQuaPhanTichCvByIdQuery, Response<GetAllKetQuaPhanTichCvsViewModel>>
    {
        public async Task<Response<GetAllKetQuaPhanTichCvsViewModel>> Handle(GetKetQuaPhanTichCvByIdQuery request, CancellationToken cancellationToken)
        {
            var entity = await context.KetQuaPhanTichCvs.FindAsync([request.Id], cancellationToken);

            if (entity == null)
            {
                return new Response<GetAllKetQuaPhanTichCvsViewModel>("Không tìm thấy kết quả phân tích CV.");
            }

            var ctx = await current.ResolveAsync();

            if (ctx.VaiTro == VaiTroNguoiDung.UNG_VIEN)
            {
                var laCuaMinh = await context.CVUngViens
                    .AsNoTracking()
                    .AnyAsync(
                        x => x.Id == entity.CVUngVienId && x.HoSoUngVien.NguoiDungId == ctx.Id,
                        cancellationToken);
                if (!laCuaMinh)
                {
                    return new Response<GetAllKetQuaPhanTichCvsViewModel>("Không tìm thấy kết quả phân tích CV.");
                }
            }
            else if (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU ||
                     ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
            {
                var trongPhamVi = await context.DonUngTuyens
                    .AsNoTracking()
                    .AnyAsync(
                        d => d.CVUngVienId == entity.CVUngVienId &&
                            (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU
                                ? d.TinTuyenDung.NguoiDangTinId == ctx.Id
                                : d.TinTuyenDung.DoanhNghiepId == ctx.DoanhNghiepId),
                        cancellationToken);
                if (!trongPhamVi)
                {
                    return new Response<GetAllKetQuaPhanTichCvsViewModel>("Không tìm thấy kết quả phân tích CV.");
                }
            }

            return new Response<GetAllKetQuaPhanTichCvsViewModel>(mapper.Map<GetAllKetQuaPhanTichCvsViewModel>(entity));
        }
    }