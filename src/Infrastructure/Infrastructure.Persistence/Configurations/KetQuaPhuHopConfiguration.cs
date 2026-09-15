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
        }
    }
}
