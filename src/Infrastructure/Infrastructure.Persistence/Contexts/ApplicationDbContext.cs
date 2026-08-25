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
        public DbSet<nguoiDung> nguoiDungs { get; set; }
        public DbSet<thongBao> thongBaos { get; set; }
        public DbSet<tinTuyenDung> tinTuyenDungs { get; set; }
        public DbSet<lichPhongVan> lichPhongVans { get; set; }
        public DbSet<kyNang> kyNangs { get; set; }
        public DbSet<kyNangUngVien> kyNangUngViens { get; set; }
        public DbSet<kyNangTinTuyenDung> kyNangTinTuyenDungs { get; set; }
        public DbSet<ketQuaPhanTichCv> ketQuaPhanTichCvs { get; set; }
        public DbSet<ketQuaPhuHop> ketQuaPhuHops { get; set; }
        public DbSet<hoSoUngVien> hoSoUngViens { get; set; }
        public DbSet<hoSoNhaTuyenDung> hoSoNhaTuyenDungs { get; set; }
        public DbSet<donUngTuyen> donUngTuyens { get; set; }
        public DbSet<doanhNghiep> doanhNghieps { get; set; }
        public DbSet<danhMucNghe> danhMucNghes { get; set; }
        public DbSet<cvUngVien> cvUngViens { get; set; }
        public DbSet<kinhNghiemLamViec> kinhNghiemLamViecs { get; set; }
        public DbSet<danhGia> danhGias {get; set;}

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = new CancellationToken())
        {
            foreach (var entry in ChangeTracker.Entries<AuditableBaseEntity>())
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.Created = _dateTime.NowUtc;
                        entry.Entity.CreatedBy = _authenticatedUser.UserId;
                        break;
                    case EntityState.Modified:
                        entry.Entity.LastModified = _dateTime.NowUtc;
                        entry.Entity.LastModifiedBy = _authenticatedUser.UserId;
                        break;
                }
            }
            return base.SaveChangesAsync(cancellationToken);
        }
        protected override void OnModelCreating(ModelBuilder builder)
        {
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
