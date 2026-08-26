using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class ThongBaoConfiguration : IEntityTypeConfiguration<ThongBao>
    {
        public void Configure(EntityTypeBuilder<ThongBao> builder)
        {
            builder.ToTable("ThongBao");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.TieuDe).IsRequired().HasMaxLength(255);
            builder.Property(x => x.NoiDung).IsRequired();
            builder.Property(x => x.LoaiThongBao).IsRequired().HasConversion<string>().HasMaxLength(50);

            builder.HasOne(x => x.NguoiDung)
                   .WithMany()
                   .HasForeignKey(x => x.NguoiDungId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}