using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class KetQuaPhanTichCvConfiguration : IEntityTypeConfiguration<ketQuaPhanTichCv>
    {
        public void Configure(EntityTypeBuilder<ketQuaPhanTichCv> builder)
        {
            builder.ToTable("ketQuaPhanTichCv");
            builder.HasKey(x => x.Id);

            builder.HasOne(x => x.cvUngViens)
                   .WithMany(x => x.ketQuaPhanTichCvs)
                   .HasForeignKey(x => x.cvUngVienId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}