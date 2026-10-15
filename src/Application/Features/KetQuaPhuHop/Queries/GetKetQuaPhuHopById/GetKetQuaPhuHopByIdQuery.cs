using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.KetQuaPhuHop.Queries.GetKetQuaPhuHopById
{
    public class GetKetQuaPhuHopByIdQuery : IRequest<Response<GetAllKetQuaPhuHops.GetAllKetQuaPhuHopsViewModel>>
    {
        public int Id { get; set; }
    }

    public class GetKetQuaPhuHopByIdQueryHandler(
        IApplicationDbContext context,
        IMapper mapper,
        ICurrentNguoiDungService current)
        : IRequestHandler<GetKetQuaPhuHopByIdQuery, Response<GetAllKetQuaPhuHops.GetAllKetQuaPhuHopsViewModel>>
    {
        public async Task<Response<GetAllKetQuaPhuHops.GetAllKetQuaPhuHopsViewModel>> Handle(
            GetKetQuaPhuHopByIdQuery request,
            CancellationToken cancellationToken)
        {
            var ctx = await current.ResolveAsync();

            var query = context.KetQuaPhuHops
                .AsNoTracking()
                .Where(x => x.Id == request.Id);

            // Detail phải dùng cùng phạm vi dữ liệu với endpoint list.
            // Không trả lỗi phân quyền riêng để tránh xác nhận một ID tồn tại.
            if (ctx.VaiTro == VaiTroNguoiDung.UNG_VIEN)
            {
                query = query.Where(x => x.HoSoUngVien.NguoiDungId == ctx.Id);
            }
            else if (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU)
            {
                query = query.Where(x => x.TinTuyenDung.NguoiDangTinId == ctx.Id);
            }
            else if (ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
            {
                query = query.Where(x => x.TinTuyenDung.DoanhNghiepId == ctx.DoanhNghiepId);
            }
            else if (ctx.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN)
            {
                query = query.Where(_ => false);
            }

            var entity = await query.FirstOrDefaultAsync(cancellationToken);

            if (entity == null)
            {
                return new Response<GetAllKetQuaPhuHops.GetAllKetQuaPhuHopsViewModel>(
                    "Không tìm thấy kết quả phù hợp.");
            }

            var result = mapper.Map<GetAllKetQuaPhuHops.GetAllKetQuaPhuHopsViewModel>(
                entity);

            return new Response<GetAllKetQuaPhuHops.GetAllKetQuaPhuHopsViewModel>(
                result);
        }
    }
}
