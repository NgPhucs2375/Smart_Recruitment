using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class KyNangUngVienConfiguration : IEntityTypeConfiguration<KyNangUngVien>
    {
        public void Configure(EntityTypeBuilder<KyNangUngVien> builder)
        {
            builder.ToTable("KyNangUngVien");
            builder.HasKey(x => x.Id);

            builder.HasOne(x => x.HoSoUngVien)
                   .WithMany(x => x.KyNangUngViens)
                   .HasForeignKey(x => x.HoSoUngVienId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.KyNang)
                   .WithMany(x => x.KyNangUngViens)
                   .HasForeignKey(x => x.KyNangId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}