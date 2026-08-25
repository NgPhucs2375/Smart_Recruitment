using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class KyNangTinTuyenDungConfiguration : IEntityTypeConfiguration<kyNangTinTuyenDung>
    {
        public void Configure(EntityTypeBuilder<kyNangTinTuyenDung> builder)
        {
            builder.ToTable("kyNangTinTuyenDung");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.mucDoYeuCau).HasMaxLength(50);

            builder.HasOne(x => x.tinTuyenDungs)
                   .WithMany(x => x.kyNangTinTuyenDungs)
                   .HasForeignKey(x => x.tinTuyenDungId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.kyNangs)
                   .WithMany(x => x.kyNangTinTuyenDungs)
                   .HasForeignKey(x => x.kyNangId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}