using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class DonUngTuyenCvPhienBanConfiguration : IEntityTypeConfiguration<DonUngTuyen>
{
    public void Configure(EntityTypeBuilder<DonUngTuyen> builder)
    {
        builder.HasOne(x => x.CVPhienBan)
            .WithMany(x => x.DonUngTuyens)
            .HasForeignKey(x => x.CVPhienBanId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
