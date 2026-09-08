
using Domain.Enums;

namespace Application.Features.DonUngTuyen.Queries.GetAllDonUngTuyens
{
    public class GetAllDonUngTuyensViewModel
    {
        public int Id { get; set; }
        public int HoSoUngVienId { get; set; }
        public int TinTuyenDungId { get; set; }
        public int CVUngVienId { get; set; }
        public TrangThaiDonUngTuyen TrangThai { get; set; }
        public string GhiChu { get; set; }
    }
}

