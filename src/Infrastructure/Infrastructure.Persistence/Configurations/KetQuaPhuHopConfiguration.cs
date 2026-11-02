using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class KetQuaPhuHopConfiguration : IEntityTypeConfiguration<KetQuaPhuHop>
    {
        public void Configure(EntityTypeBuilder<KetQuaPhuHop> builder)
        {
            builder.ToTable("KetQuaPhuHop");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.PhanLoai).HasConversion<string>().HasMaxLength(50);

            builder.HasOne(x => x.HoSoUngVien)
                   .WithMany(x => x.KetQuaPhuHops)
                   .HasForeignKey(x => x.HoSoUngVienId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.CVUngVien)
                   .WithMany()
                   .HasForeignKey(x => x.CVUngVienId)
                   .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(x => x.TinTuyenDung)
                   .WithMany()
                   .HasForeignKey(x => x.TinTuyenDungId)
                   .OnDelete(DeleteBehavior.Cascade);

            // Một cặp hồ sơ/CV/tin chỉ được lưu một kết quả. Hai đường ghi
            // (người dùng lướt trang gợi ý, job quét pool) upsert trên khoá này.
            builder.HasIndex(x => new { x.HoSoUngVienId, x.CVUngVienId, x.TinTuyenDungId })
                   .IsUnique()
                   .HasDatabaseName("IX_KetQuaPhuHop_HoSoUngVien_CV_Tin");

            builder.HasIndex(x => new { x.TinTuyenDungId, x.DiemPhuHop })
                   .IsDescending(false, true)
                   .HasDatabaseName("IX_KetQuaPhuHop_Tin_Diem");
        }
    }
}
