using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class LoiMoiNhanSuConfiguration : IEntityTypeConfiguration<LoiMoiNhanSu>
    {
        public void Configure(EntityTypeBuilder<LoiMoiNhanSu> builder)
        {
            builder.ToTable("LoiMoiNhanSu");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.Email).IsRequired().HasMaxLength(255);
            builder.Property(x => x.Token).IsRequired().HasMaxLength(255);
            builder.HasIndex(x => x.Token).IsUnique();
            builder.Property(x => x.HoTen).HasMaxLength(255);
            builder.Property(x => x.ChucVu).HasMaxLength(255);
            builder.Property(x => x.LoiMoi).IsRequired().HasConversion<string>().HasMaxLength(50);
            builder.Property(x => x.NgayHetHan).IsRequired();

            builder.HasOne(x => x.DoanhNghiep)
                   .WithMany(x => x.LoiMoiNhanSus)
                   .HasForeignKey(x => x.DoanhNghiepId)
                   .OnDelete(DeleteBehavior.Cascade);
            
            builder.HasOne(x => x.NguoiDaiDien)
                   .WithMany(x => x.LoiMoiNhanSus)
                   .HasForeignKey(x => x.NguoiDaiDienId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}