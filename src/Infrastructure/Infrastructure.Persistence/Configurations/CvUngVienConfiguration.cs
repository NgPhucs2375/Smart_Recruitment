using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class CvUngVienConfiguration : IEntityTypeConfiguration<CVUngVien>
    {
        public void Configure(EntityTypeBuilder<CVUngVien> builder)
        {
            builder.ToTable("CVUngVien");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.TenFile).IsRequired().HasMaxLength(255);
            builder.Property(x => x.FileUrl).IsRequired().HasMaxLength(500);

            builder.HasOne(x => x.HoSoUngVien)
                   .WithMany(x => x.CVUngViens)
                   .HasForeignKey(x => x.HoSoUngVienId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}