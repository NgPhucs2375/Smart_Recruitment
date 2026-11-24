using Domain.Enums;

namespace Application.Features.NguoiDung.Queries.GetAllNguoiDungs
{
    public class GetAllNguoiDungsViewModel
    {
        public int Id { get; set; }
        public string ApplicationUserId { get; set; }
        public VaiTroNguoiDung VaiTro { get; set; }
        public bool IsActive { get; set; }
        public DateTime Created { get; set; }
        public bool HasRelatedData { get; set; }
    }
}
