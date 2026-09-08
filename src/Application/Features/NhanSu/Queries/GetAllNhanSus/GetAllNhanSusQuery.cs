using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.NhanSu.Queries.GetAllNhanSus
{
    public class GetAllNhanSusQuery : IRequest<Response<IEnumerable<NhanSuVm>>> { }

    public class NhanSuVm
    {
        public int NguoiDungId { get; set; }
        public int HoSoId { get; set; }
        public string HoTen { get; set; }
        public string ChucVu { get; set; }
        public string VaiTro { get; set; }
    }

    public class GetAllNhanSusQueryHandler : IRequestHandler<GetAllNhanSusQuery, Response<IEnumerable<NhanSuVm>>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IAuthenticatedUserService _auth;

        public GetAllNhanSusQueryHandler(IApplicationDbContext context, IAuthenticatedUserService auth)
        {
            _context = context;
            _auth = auth;
        }

        public async Task<Response<IEnumerable<NhanSuVm>>> Handle(GetAllNhanSusQuery q, CancellationToken ct)
        {
            var ndd = await _context.NguoiDungs.FirstOrDefaultAsync(n => n.ApplicationUserId == _auth.UserId, ct);
            if (ndd == null)
                return new Response<IEnumerable<NhanSuVm>>("Không xác định người dùng.");

            var hs = await _context.HoSoNhaTuyenDungs.FirstOrDefaultAsync(h => h.NguoiDungId == ndd.Id, ct);
            if (hs == null)
                return new Response<IEnumerable<NhanSuVm>>("Không xác định doanh nghiệp.");

            var list = await _context.HoSoNhaTuyenDungs
                .Include(h => h.NguoiDung)
                .Where(h => h.DoanhNghiepId == hs.DoanhNghiepId)
                .Select(h => new NhanSuVm
                {
                    NguoiDungId = h.NguoiDungId,
                    HoSoId = h.Id,
                    HoTen = h.HoTen,
                    ChucVu = h.ChucVu,
                    VaiTro = h.NguoiDung.VaiTro.ToString()
                })
                .ToListAsync(ct);

            return new Response<IEnumerable<NhanSuVm>>(list);
        }
    }
}
