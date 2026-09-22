// using Domain.Entities;
// using Application.Interfaces.Repositories;
// using Application.Wrappers;
// using Application.Features.HoSoUngVien.Queries.GetAllHoSoUngViens;
// using Infrastructure.Persistence.Contexts;
// using Microsoft.EntityFrameworkCore;

// namespace Infrastructure.Persistence.Repositories
// {
//     public class HosoUngVienRepositoryAsync 
//         : GenericRepositoryAsync<hoSoUngVien>, IHosoUngVienRepositoryAsync
//     {
//         private readonly ApplicationDbContext _dbContext;

//         public HosoUngVienRepositoryAsync(ApplicationDbContext dbContext) 
//             : base(dbContext)  // ← Gọi base class trước
//         {
//             _dbContext = dbContext;
//         }

//         // Method custom: Include kinh nghiệm + kỹ năng
//         public async Task<hoSoUngVien> GetWithDetailsAsync(int id)
//         {
//             return await _dbContext.HoSoUngViens
//                 .Include(h => h.KinhNghiemLamViecs)    // Navigation property
//                 .Include(h => h.KyNangUngViens)        // Navigation property
//                     .ThenInclude(k => k.KyNang)        // Include thêm KyNang
//                 .FirstOrDefaultAsync(h => h.Id == id);
//         }

//         // Method custom: Paged list
//         public async Task<PagedList<hoSoUngVien>> GetPagedHosoUngViensAsync(
//             GetAllHoSoUngViensParameter parameter)
//         {
//             var query = _dbContext.HoSoUngViens
//                 .AsQueryable();
            
//             // Apply filter nếu có
//             if (parameter._filter != null && parameter._filter.Count > 0)
//                 query = MethodExtensions.ApplyFilters(query, parameter._filter);

//             return await PagedList<hoSoUngVien>.ToPagedList(
//                 query.OrderByDynamic(parameter._sort, parameter._order).AsNoTracking(),
//                 parameter._start, 
//                 parameter._end);
//         }
//     }
// }