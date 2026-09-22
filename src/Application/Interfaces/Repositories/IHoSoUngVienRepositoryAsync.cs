// using Application.Wrappers;
// using Domain.Entities;
// using Application.Features.HoSoUngVien.Queries.GetAllHoSoUngViens;

// namespace Application.Interfaces.Repositories
// {
//     public interface IHosoUngVienRepositoryAsync : IGenericRepositoryAsync<hoSoUngVien>
//     {
//         // Method custom: lấy hồ sơ kèm kinh nghiệm + kỹ năng
//         Task<hoSoUngVien> GetWithDetailsAsync(int id);
        
//         // Method custom: lấy paged list với filter
//         Task<PagedList<hoSoUngVien>> GetPagedHosoUngViensAsync(GetAllHoSoUngViensParameter parameter);
//     }
// }