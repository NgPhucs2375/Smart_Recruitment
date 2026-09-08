using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.NhanSu.Queries.GetLoiMoiByToken
{
    public class GetLoiMoiByTokenQuery : IRequest<Response<LoiMoiNhanSuVm>>
    {
        public string Token { get; set; }
    }

    public class LoiMoiNhanSuVm
    {
        public string Email { get; set; }
        public string HoTen { get; set; }
        public string ChucVu { get; set; }
        public string TenDoanhNghiep { get; set; }
        public string TrangThai { get; set; }
    }

    public class GetLoiMoiByTokenQueryHandler : IRequestHandler<GetLoiMoiByTokenQuery, Response<LoiMoiNhanSuVm>>
    {
        private readonly IApplicationDbContext _context;

        public GetLoiMoiByTokenQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Response<LoiMoiNhanSuVm>> Handle(GetLoiMoiByTokenQuery q, CancellationToken ct)
        {
            var entity = await _context.LoiMoiNhanSus
                .Include(l => l.DoanhNghiep)
                .FirstOrDefaultAsync(l => l.Token == q.Token, ct);

            if (entity == null)
                return new Response<LoiMoiNhanSuVm>("Lời mời không tồn tại.");

            var vm = new LoiMoiNhanSuVm
            {
                Email = entity.Email,
                HoTen = entity.HoTen,
                ChucVu = entity.ChucVu,
                TenDoanhNghiep = entity.DoanhNghiep?.TenDoanhNghiep,
                TrangThai = entity.LoiMoi.ToString()
            };

            return new Response<LoiMoiNhanSuVm>(vm);
        }
    }
}
