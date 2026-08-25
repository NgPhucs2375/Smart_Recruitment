using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class TinTuyenDungConfiguration : IEntityTypeConfiguration<tinTuyenDung>
    {
        public void Configure(EntityTypeBuilder<tinTuyenDung> builder)
        {
            builder.ToTable("tinTuyenDung");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.tieuDe).IsRequired().HasMaxLength(255);
            builder.Property(x => x.moTaCongViec).IsRequired();
            builder.Property(x => x.yeuCauCongViec).IsRequired();
            builder.Property(x => x.diaDiemLamViec).IsRequired().HasMaxLength(255);
            builder.Property(x => x.trangThai).IsRequired().HasConversion<string>().HasMaxLength(50);

            // Quan hệ với DoanhNghiep
            builder.HasOne(x => x.doanhNghieps)
                   .WithMany(x => x.tinTuyenDungs)
                   .HasForeignKey(x => x.doanhNghiepId)
                   .OnDelete(DeleteBehavior.Restrict);

            // Quan hệ với DanhMucNghe
            builder.HasOne(x => x.danhMucNghes)
                   .WithMany(x => x.tinTuyenDungs)
                   .HasForeignKey(x => x.danhMucNgheId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}