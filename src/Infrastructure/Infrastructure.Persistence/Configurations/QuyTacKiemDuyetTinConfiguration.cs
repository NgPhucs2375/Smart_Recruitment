using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class QuyTacKiemDuyetTinConfiguration : IEntityTypeConfiguration<QuyTacKiemDuyetTin>
    {
        public void Configure(EntityTypeBuilder<QuyTacKiemDuyetTin> builder)
        {
            builder.ToTable("QuyTacKiemDuyetTin");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.TuKhoa).IsRequired().HasMaxLength(255);
            builder.Property(x => x.MoTa).HasMaxLength(500);
            builder.HasIndex(x => new { x.TuKhoa, x.Loai }).IsUnique();

            var seededAt = new System.DateTime(2026, 9, 21, 0, 0, 0, System.DateTimeKind.Utc);
            QuyTacKiemDuyetTin Rule(int id, string keyword, Domain.Enums.LoaiQuyTacKiemDuyet type, int score, string description)
                => new() { Id = id, TuKhoa = keyword, Loai = type, DiemTru = score, MoTa = description, IsActive = true, Created = seededAt, CreatedBy = "system" };

            builder.HasData(
                Rule(1, "viec nhe luong cao", Domain.Enums.LoaiQuyTacKiemDuyet.TuKhoaCam, 100, "Dấu hiệu lừa đảo"),
                Rule(2, "dat coc", Domain.Enums.LoaiQuyTacKiemDuyet.TuKhoaCam, 100, "Yêu cầu đặt cọc"),
                Rule(3, "phi tham gia", Domain.Enums.LoaiQuyTacKiemDuyet.TuKhoaCam, 100, "Thu phí ứng viên"),
                Rule(4, "phi giu cho", Domain.Enums.LoaiQuyTacKiemDuyet.TuKhoaCam, 100, "Thu phí ứng viên"),
                Rule(5, "phi dao tao", Domain.Enums.LoaiQuyTacKiemDuyet.TuKhoaCam, 100, "Thu phí ứng viên"),
                Rule(6, "phi ho so", Domain.Enums.LoaiQuyTacKiemDuyet.TuKhoaCam, 100, "Thu phí ứng viên"),
                Rule(7, "phi tuyen dung", Domain.Enums.LoaiQuyTacKiemDuyet.TuKhoaCam, 100, "Thu phí ứng viên"),
                Rule(8, "nop tien truoc", Domain.Enums.LoaiQuyTacKiemDuyet.TuKhoaCam, 100, "Yêu cầu chuyển tiền"),
                Rule(9, "chuyen tien truoc", Domain.Enums.LoaiQuyTacKiemDuyet.TuKhoaCam, 100, "Yêu cầu chuyển tiền"),
                Rule(10, "chi tuyen nam", Domain.Enums.LoaiQuyTacKiemDuyet.TuKhoaCam, 100, "Phân biệt giới tính"),
                Rule(11, "chi tuyen nu", Domain.Enums.LoaiQuyTacKiemDuyet.TuKhoaCam, 100, "Phân biệt giới tính"),
                Rule(12, "thu nhap khong gioi han", Domain.Enums.LoaiQuyTacKiemDuyet.TinHieuRuiRo, 25, "Cam kết thu nhập phi thực tế"),
                Rule(13, "co hoi lam giau", Domain.Enums.LoaiQuyTacKiemDuyet.TinHieuRuiRo, 25, "Cam kết làm giàu"),
                Rule(14, "kiem tien nhanh", Domain.Enums.LoaiQuyTacKiemDuyet.TinHieuRuiRo, 25, "Cam kết thu nhập phi thực tế"),
                Rule(15, "kiem tien online", Domain.Enums.LoaiQuyTacKiemDuyet.TinHieuRuiRo, 25, "Dấu hiệu tuyển dụng không rõ ràng"),
                Rule(16, "khong can hop dong", Domain.Enums.LoaiQuyTacKiemDuyet.TinHieuRuiRo, 15, "Thiếu cam kết lao động"),
                Rule(17, "khong can cv", Domain.Enums.LoaiQuyTacKiemDuyet.TinHieuRuiRo, 15, "Quy trình tuyển dụng rủi ro"),
                Rule(18, "phi nhap hoc", Domain.Enums.LoaiQuyTacKiemDuyet.TuKhoaCam, 100, "Thu phí ứng viên"),
                Rule(19, "pyramid scheme", Domain.Enums.LoaiQuyTacKiemDuyet.TuKhoaCam, 100, "Mô hình kim tự tháp"),
                Rule(20, "multi level marketing", Domain.Enums.LoaiQuyTacKiemDuyet.TuKhoaCam, 100, "Dấu hiệu đa cấp"),
                Rule(21, "chi nhan nam", Domain.Enums.LoaiQuyTacKiemDuyet.TuKhoaCam, 100, "Phân biệt giới tính"),
                Rule(22, "chi nhan nu", Domain.Enums.LoaiQuyTacKiemDuyet.TuKhoaCam, 100, "Phân biệt giới tính"),
                Rule(23, "khong nhan nam", Domain.Enums.LoaiQuyTacKiemDuyet.TuKhoaCam, 100, "Phân biệt giới tính"),
                Rule(24, "khong nhan nu", Domain.Enums.LoaiQuyTacKiemDuyet.TuKhoaCam, 100, "Phân biệt giới tính"),
                Rule(25, "khong tuyen nam", Domain.Enums.LoaiQuyTacKiemDuyet.TuKhoaCam, 100, "Phân biệt giới tính"),
                Rule(26, "khong tuyen nu", Domain.Enums.LoaiQuyTacKiemDuyet.TuKhoaCam, 100, "Phân biệt giới tính"),
                Rule(27, "khong tuyen phu nu", Domain.Enums.LoaiQuyTacKiemDuyet.TuKhoaCam, 100, "Phân biệt giới tính"),
                Rule(28, "nhan tien ngay", Domain.Enums.LoaiQuyTacKiemDuyet.TinHieuRuiRo, 15, "Cam kết thanh toán phi thực tế"),
                Rule(29, "tra tien ngay", Domain.Enums.LoaiQuyTacKiemDuyet.TinHieuRuiRo, 15, "Cam kết thanh toán phi thực tế"));
        }
    }
}
