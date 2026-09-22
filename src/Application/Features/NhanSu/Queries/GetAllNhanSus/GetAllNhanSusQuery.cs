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

    public class GetAllNhanSusQueryHandler(
        IApplicationDbContext context,
        IAuthenticatedUserService auth)
        : IRequestHandler<GetAllNhanSusQuery, Response<IEnumerable<NhanSuVm>>>
    {
        public async Task<Response<IEnumerable<NhanSuVm>>> Handle(
            GetAllNhanSusQuery request,
            CancellationToken cancellationToken)
        {
            var ndd = await context.NguoiDungs
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.ApplicationUserId == auth.UserId,
                    cancellationToken);

            if (ndd == null)
            {
                return new Response<IEnumerable<NhanSuVm>>(
                    "Không xác định người dùng.");
            }

            var hs = await context.HoSoNhaTuyenDungs
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.NguoiDungId == ndd.Id,
                    cancellationToken);

            if (hs == null)
            {
                return new Response<IEnumerable<NhanSuVm>>(
                    "Không xác định doanh nghiệp.");
            }

            var list = await context.HoSoNhaTuyenDungs
                .AsNoTracking()
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
                .ToListAsync(cancellationToken);

            return new Response<IEnumerable<NhanSuVm>>(list);
        }
    }
}
