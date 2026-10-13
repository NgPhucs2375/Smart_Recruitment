using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using Domain.Enums;
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
        public string SDT { get; set; }
        public string Email { get; set; }
        public bool IsActive { get; set; }
    }

    public class GetAllNhanSusQueryHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current)
        : IRequestHandler<GetAllNhanSusQuery, Response<IEnumerable<NhanSuVm>>>
    {
        public async Task<Response<IEnumerable<NhanSuVm>>> Handle(
            GetAllNhanSusQuery request,
            CancellationToken cancellationToken)
        {
            var actor = await current.ResolveAsync();
            if (actor.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN &&
                (actor.VaiTro != VaiTroNguoiDung.NGUOI_DAI_DIEN || !actor.DoanhNghiepId.HasValue))
            {
                return new Response<IEnumerable<NhanSuVm>>(
                    "Không xác định doanh nghiệp hoặc bạn không có quyền quản lý Nhân sự.");
            }

            var list = await context.HoSoNhaTuyenDungs
                .AsNoTracking()
                .Include(h => h.NguoiDung)
                .Where(h => (actor.VaiTro == VaiTroNguoiDung.QUAN_TRI_VIEN || h.DoanhNghiepId == actor.DoanhNghiepId) &&
                    (h.NguoiDung.VaiTro == VaiTroNguoiDung.NHAN_SU || h.NguoiDung.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN))
                .OrderBy(h => h.HoTen).ThenBy(h => h.Id)
                .Select(h => new NhanSuVm
                {
                    NguoiDungId = h.NguoiDungId,
                    HoSoId = h.Id,
                    HoTen = h.HoTen,
                    ChucVu = h.ChucVu,
                    VaiTro = h.NguoiDung.VaiTro.ToString(), SDT = h.SDT, IsActive = h.NguoiDung.IsActive
                })
                .ToListAsync(cancellationToken);

            return new Response<IEnumerable<NhanSuVm>>(list);
        }
    }
}
