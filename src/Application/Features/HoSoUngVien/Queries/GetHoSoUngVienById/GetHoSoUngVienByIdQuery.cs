using Application.Exceptions;
using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.HoSoUngVien.Queries.GetHoSoUngVienById
{
    public class GetHoSoUngVienByIdQuery : IRequest<Response<GetAllHoSoUngViens.GetAllHoSoUngViensViewModel>>
    {
        public int Id { get; set; }
    }

    public class GetHoSoUngVienByIdQueryHandler : IRequestHandler<GetHoSoUngVienByIdQuery, Response<GetAllHoSoUngViens.GetAllHoSoUngViensViewModel>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly ICurrentNguoiDungService _current;

        public GetHoSoUngVienByIdQueryHandler(IApplicationDbContext context, IMapper mapper, ICurrentNguoiDungService current)
        {
            _context = context;
            _mapper = mapper;
            _current = current;
        }

        public async Task<Response<GetAllHoSoUngViens.GetAllHoSoUngViensViewModel>> Handle(GetHoSoUngVienByIdQuery request, CancellationToken cancellationToken)
        {
            var entity = await _context.HoSoUngViens.FindAsync(request.Id);
            if (entity == null)
                return new Response<GetAllHoSoUngViens.GetAllHoSoUngViensViewModel>("Không tìm thấy hồ sơ ứng viên.");

            var ctx = await _current.ResolveAsync();

            if (ctx.VaiTro == VaiTroNguoiDung.UNG_VIEN)
            {
                if (entity.NguoiDungId != ctx.Id)
                    throw new ApiException("Bạn chỉ được xem hồ sơ của chính mình.", 403);
            }
            else // NGUOI_DAI_DIEN / NHAN_SU: chỉ xem ứng viên đã nộp đơn vào tin thuộc quyền
            {
                bool accessible = await _context.DonUngTuyens.AnyAsync(d =>
                    d.HoSoUngVienId == request.Id &&
                    d.TinTuyenDung != null &&
                    (ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN
                        ? d.TinTuyenDung.DoanhNghiepId == ctx.DoanhNghiepId
                        : d.TinTuyenDung.NguoiDangTinId == ctx.Id),
                    cancellationToken);

                if (!accessible)
                    throw new ApiException("Bạn không có quyền xem hồ sơ ứng viên này.", 403);
            }

            var result = _mapper.Map<GetAllHoSoUngViens.GetAllHoSoUngViensViewModel>(entity);
            return new Response<GetAllHoSoUngViens.GetAllHoSoUngViensViewModel>(result);
        }
    }
}
