using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Domain.Entities;

namespace Infrastructure.Persistence.Configurations
{
    public class DanhMucKyNangConfiguration : IEntityTypeConfiguration<DanhMucKyNang>
    {
        public void Configure(EntityTypeBuilder<DanhMucKyNang> builder)
        {
            // Table/ cột giữ tên cũ trong DB; chỉ entity C# mang tên danh mục.
            builder.ToTable("KyNang");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.TenKyNang).IsRequired().HasMaxLength(255);
            builder.HasIndex(x => x.TenKyNang).IsUnique();
            builder.Property(x => x.MoTa).HasMaxLength(500);
        }
    }
}