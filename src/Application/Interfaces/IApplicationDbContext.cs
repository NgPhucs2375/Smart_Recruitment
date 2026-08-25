using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface IApplicationDbContext
    {
        DbSet<nguoiDung> nguoiDungs { get; set; }
        DbSet<thongBao> thongBaos { get; set; }
        DbSet<tinTuyenDung> tinTuyenDungs { get; set; }
        DbSet<lichPhongVan> lichPhongVans { get; set; }
        DbSet<kyNang> kyNangs { get; set; }
        DbSet<kyNangUngVien> kyNangUngViens { get; set; }
        DbSet<kyNangTinTuyenDung> kyNangTinTuyenDungs { get; set; }
        DbSet<ketQuaPhanTichCv> ketQuaPhanTichCvs { get; set; }
        DbSet<ketQuaPhuHop> ketQuaPhuHops { get; set; }
        DbSet<hoSoUngVien> hoSoUngViens { get; set; }
        DbSet<hoSoNhaTuyenDung> hoSoNhaTuyenDungs { get; set; }
        DbSet<donUngTuyen> donUngTuyens { get; set; }
        DbSet<doanhNghiep> doanhNghieps { get; set; }
        DbSet<danhMucNghe> danhMucNghes { get; set; }
        DbSet<cvUngVien> cvUngViens { get; set; }
        DbSet<kinhNghiemLamViec> kinhNghiemLamViecs { get; set; }
        DbSet<danhGia> danhGias { get; set; }
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
