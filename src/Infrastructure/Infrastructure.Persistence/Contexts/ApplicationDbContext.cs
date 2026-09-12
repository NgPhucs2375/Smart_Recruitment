using Microsoft.EntityFrameworkCore;
using Application.Interfaces;
using Domain.Common;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Infrastructure.Persistence.Contexts
{
    public class ApplicationDbContext : DbContext, IApplicationDbContext
    {
        private readonly IDateTimeService _dateTime;
        private readonly IAuthenticatedUserService _authenticatedUser;

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, IDateTimeService dateTime, IAuthenticatedUserService authenticatedUser) : base(options)
        {
            ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;
            _dateTime = dateTime;
            _authenticatedUser = authenticatedUser;
        }
        public DbSet<NguoiDung> NguoiDungs { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<NotificationRecipient> NotificationRecipients { get; set; }
        public DbSet<TinTuyenDung> TinTuyenDungs { get; set; }
        public DbSet<KyNang> KyNangs { get; set; }
        public DbSet<KyNangTinTuyenDung> KyNangTinTuyenDungs { get; set; }
        public DbSet<KetQuaPhanTichCv> KetQuaPhanTichCvs { get; set; }
        public DbSet<KetQuaPhuHop> KetQuaPhuHops { get; set; }
        public DbSet<HoSoUngVien> HoSoUngViens { get; set; }
        public DbSet<HoSoNhaTuyenDung> HoSoNhaTuyenDungs { get; set; }
        public DbSet<LoiMoiNhanSu> LoiMoiNhanSus { get; set; }
        public DbSet<DonUngTuyen> DonUngTuyens { get; set; }
        public DbSet<DoanhNghiep> DoanhNghieps { get; set; }
        public DbSet<DanhMucNghe> DanhMucNghes { get; set; }
        public DbSet<CVUngVien> CVUngViens { get; set; }
        public DbSet<DanhGia> DanhGias {get; set;}

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = new CancellationToken())
        {
            foreach (var entry in ChangeTracker.Entries<AuditableBaseEntity>())
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.Created = NormalizeToUtc(_dateTime.NowUtc);
                        entry.Entity.CreatedBy = _authenticatedUser.UserId;
                        break;
                    case EntityState.Modified:
                        entry.Entity.LastModified = NormalizeToUtc(_dateTime.NowUtc);
                        entry.Entity.LastModifiedBy = _authenticatedUser.UserId;
                        break;
                }
            }
            // Npgsql chỉ chấp nhận DateTime Kind=Utc cho cột timestamptz.
            // JSON không kèm offset (vd: NgayHetHan) deserialize thành Kind=Unspecified -> crash khi save.
            // Chuẩn hóa mọi DateTime về UTC trước khi ghi.
            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.State != EntityState.Added && entry.State != EntityState.Modified)
                    continue;
                foreach (var property in entry.Properties)
                {
                    if (property.CurrentValue is DateTime value)
                    {
                        var normalized = NormalizeToUtc(value);
                        property.Metadata.PropertyInfo?.SetValue(entry.Entity, normalized);
                        property.CurrentValue = normalized;
                    }
                }
            }
            return base.SaveChangesAsync(cancellationToken);
        }

        private static DateTime NormalizeToUtc(DateTime value) => value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc),
        };
        protected override void OnModelCreating(ModelBuilder builder)
        {
            builder.HasPostgresExtension("vector");
            builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
            
            //tat ca cac cot decimal co kieu du lieu la decimal(18,6)
            foreach (var property in builder.Model.GetEntityTypes()
            .SelectMany(t => t.GetProperties())
            .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
            {
                property.SetColumnType("decimal(18,6)");
            }
            base.OnModelCreating(builder);

            
        }
    }
}
