using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface IApplicationDbContext
    {
        DbSet<NguoiDung> NguoiDungs { get; set; }
        DbSet<ThongBao> ThongBaos { get; set; }
        DbSet<TinTuyenDung> TinTuyenDungs { get; set; }
        DbSet<LichPhongVan> LichPhongVans { get; set; }
        DbSet<KyNang> KyNangs { get; set; }
        DbSet<KyNangUngVien> KyNangUngViens { get; set; }
        DbSet<KyNangTinTuyenDung> KyNangTinTuyenDungs { get; set; }
        DbSet<KetQuaPhanTichCv> KetQuaPhanTichCvs { get; set; }
        DbSet<KetQuaPhuHop> KetQuaPhuHops { get; set; }
        DbSet<HoSoUngVien> HoSoUngViens { get; set; }
        DbSet<HoSoNhaTuyenDung> HoSoNhaTuyenDungs { get; set; }
        DbSet<LoiMoiNhanSu> LoiMoiNhanSus { get; set; }
        DbSet<DonUngTuyen> DonUngTuyens { get; set; }
        DbSet<DoanhNghiep> DoanhNghieps { get; set; }
        DbSet<DanhMucNghe> DanhMucNghes { get; set; }
        DbSet<CVUngVien> CVUngViens { get; set; }
        DbSet<KinhNghiemLamViec> KinhNghiemLamViecs { get; set; }
        DbSet<DanhGia> DanhGias { get; set; }
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
