using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class DonUngTuyenConfiguration : IEntityTypeConfiguration<donUngTuyen>
    {
        public void Configure(EntityTypeBuilder<donUngTuyen> builder)
        {
            builder.ToTable("donUngTuyen");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.trangThai).IsRequired().HasConversion<string>().HasMaxLength(50);

            builder.HasOne(x => x.hoSoUngViens)
                   .WithMany(x => x.donUngTuyens)
                   .HasForeignKey(x => x.hoSoUngVienId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.tinTuyenDungs)
                   .WithMany(x => x.donUngTuyens)
                   .HasForeignKey(x => x.tinTuyenDungId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.cvUngViens)
                   .WithMany()
                   .HasForeignKey(x => x.cvUngVienId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}