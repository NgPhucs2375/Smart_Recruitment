using Domain.Enums;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    public class CurrentNguoiDungContext
    {
        public int Id { get; set; }
        public int? DoanhNghiepId { get; set; }
        public VaiTroNguoiDung VaiTro { get; set; }
    }

    public interface ICurrentNguoiDungService
    {
        Task<CurrentNguoiDungContext> ResolveAsync();
    }
}
