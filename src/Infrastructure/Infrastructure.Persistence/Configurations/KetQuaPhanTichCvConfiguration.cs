using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class KetQuaPhanTichCvConfiguration : IEntityTypeConfiguration<KetQuaPhanTichCv>
    {
        public void Configure(EntityTypeBuilder<KetQuaPhanTichCv> builder)
        {
            builder.ToTable("KetQuaPhanTichCv");
            builder.HasKey(x => x.Id);

            builder.HasOne(x => x.CVUngVien)
                   .WithMany(x => x.KetQuaPhanTichCvs)
                   .HasForeignKey(x => x.CVUngVienId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}