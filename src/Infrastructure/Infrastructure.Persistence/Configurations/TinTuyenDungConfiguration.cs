using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class TinTuyenDungConfiguration : IEntityTypeConfiguration<TinTuyenDung>
    {
        public void Configure(EntityTypeBuilder<TinTuyenDung> builder)
        {
            builder.ToTable("TinTuyenDung");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.TieuDe).IsRequired().HasMaxLength(255);
            builder.Property(x => x.MoTaCongViec).IsRequired();
            builder.Property(x => x.YeuCauCongViec).IsRequired();
            builder.Property(x => x.DiaDiemLamViec).IsRequired().HasMaxLength(255);
            builder.Property(x => x.TrangThai).IsRequired().HasConversion<string>().HasMaxLength(50);

            // Quan hệ với DoanhNghiep
            builder.HasOne(x => x.DoanhNghiep)
                   .WithMany(x => x.TinTuyenDungs)
                   .HasForeignKey(x => x.DoanhNghiepId)
                   .OnDelete(DeleteBehavior.Restrict);

            // Quan hệ với DanhMucNghe
            builder.HasOne(x => x.DanhMucNghe)
                   .WithMany(x => x.TinTuyenDungs)
                   .HasForeignKey(x => x.DanhMucNgheId)
                   .OnDelete(DeleteBehavior.Restrict);

            // Quan hệ với NguoiDung (người đăng tin)
            builder.HasOne(x => x.NguoiDangTin)
                   .WithMany(x => x.TinTuyenDungs)
                   .HasForeignKey(x => x.NguoiDangTinId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.NguoiDangTin)
                .WithMany(x => x.TinTuyenDungs)
                .HasForeignKey(x => x.NguoiDangTinId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Property(x => x.Embedding)
                .HasColumnType("vector(768)");
                

        }

    }
}