using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class KyNangUngVienConfiguration : IEntityTypeConfiguration<kyNangUngVien>
    {
        public void Configure(EntityTypeBuilder<kyNangUngVien> builder)
        {
            builder.ToTable("kyNangUngVien");
            builder.HasKey(x => x.Id);

            builder.HasOne(x => x.hoSoUngViens)
                   .WithMany(x => x.kyNangUngViens)
                   .HasForeignKey(x => x.hoSoUngVienId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.kyNangs)
                   .WithMany(x => x.kyNangUngViens)
                   .HasForeignKey(x => x.kyNangId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}