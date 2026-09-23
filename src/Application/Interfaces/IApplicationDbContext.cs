using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    public interface IApplicationDbContext
    {
        DbSet<NguoiDung> NguoiDungs { get; set; }
        DbSet<Notification> Notifications { get; set; }
        DbSet<NotificationRecipient> NotificationRecipients { get; set; }
        DbSet<TinTuyenDung> TinTuyenDungs { get; set; }
        DbSet<KyNang> KyNangs { get; set; }
        DbSet<KyNangTinTuyenDung> KyNangTinTuyenDungs { get; set; }
        DbSet<global::KyNangUngVien> KyNangUngViens { get; set; }
        DbSet<KetQuaPhanTichCv> KetQuaPhanTichCvs { get; set; }
        DbSet<KetQuaPhuHop> KetQuaPhuHops { get; set; }
        DbSet<HoSoUngVien> HoSoUngViens { get; set; }
        DbSet<HoSoNhaTuyenDung> HoSoNhaTuyenDungs { get; set; }
        DbSet<LoiMoiNhanSu> LoiMoiNhanSus { get; set; }
        DbSet<DonUngTuyen> DonUngTuyens { get; set; }
        DbSet<DoanhNghiep> DoanhNghieps { get; set; }
        DbSet<DanhMucNghe> DanhMucNghes { get; set; }
        DbSet<QuyTacKiemDuyetTin> QuyTacKiemDuyetTins { get; set; }
        DbSet<CVUngVien> CVUngViens { get; set; }
        DbSet<CVImportSession> CVImportSessions { get; set; }
        DbSet<CVTepTin> CVTepTins { get; set; }
        DbSet<CVPhienBan> CVPhienBans { get; set; }
        DbSet<DanhGia> DanhGias { get; set; }
        DbSet<Conversation> Conversations { get; set; }
        DbSet<Message> Messages { get; set; }
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}
