using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using Domain.Enums;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.HoSoNhaTuyenDung.Queries.GetHoSoNhaTuyenDungById
{
    public class GetHoSoNhaTuyenDungByIdQuery : IRequest<Response<GetAllHoSoNhaTuyenDungs.GetAllHoSoNhaTuyenDungsViewModel>>
    {
        public int Id { get; set; }
    }

    public class GetHoSoNhaTuyenDungByIdQueryHandler(
        IApplicationDbContext context,
        IMapper mapper,
        ICurrentNguoiDungService current)
        : IRequestHandler<GetHoSoNhaTuyenDungByIdQuery, Response<GetAllHoSoNhaTuyenDungs.GetAllHoSoNhaTuyenDungsViewModel>>
    {
        public async Task<Response<GetAllHoSoNhaTuyenDungs.GetAllHoSoNhaTuyenDungsViewModel>> Handle(
            GetHoSoNhaTuyenDungByIdQuery request,
            CancellationToken cancellationToken)
        {
            var entity = await context.HoSoNhaTuyenDungs
                .FindAsync([request.Id], cancellationToken);

            if (entity == null)
            {
                return new Response<GetAllHoSoNhaTuyenDungs.GetAllHoSoNhaTuyenDungsViewModel>(
                    "Không tìm thấy hồ sơ nhà tuyển dụng.");
            }

            var ctx = await current.ResolveAsync();

            // Nhân sự / Người đại diện chỉ xem hồ sơ của chính mình
            // hoặc đồng nghiệp cùng doanh nghiệp.
            if (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU ||
                ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
            {
                var duocXem = entity.NguoiDungId == ctx.Id ||
                    (ctx.DoanhNghiepId.HasValue && entity.DoanhNghiepId == ctx.DoanhNghiepId.Value);
                if (!duocXem)
                {
                    return new Response<GetAllHoSoNhaTuyenDungs.GetAllHoSoNhaTuyenDungsViewModel>(
                        "Bạn không có quyền xem hồ sơ này.");
                }
            }

            var result = mapper.Map<GetAllHoSoNhaTuyenDungs.GetAllHoSoNhaTuyenDungsViewModel>(
                entity);

            return new Response<GetAllHoSoNhaTuyenDungs.GetAllHoSoNhaTuyenDungsViewModel>(
                result);
        }
    }
}
