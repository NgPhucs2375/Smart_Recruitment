
using Domain.Enums;

namespace Application.Features.DonUngTuyen.Queries.GetAllDonUngTuyens
{
    public class GetAllDonUngTuyensViewModel
    {
        public int Id { get; set; }
        public int HoSoUngVienId { get; set; }
        public int TinTuyenDungId { get; set; }
        public int CVUngVienId { get; set; }
        public int? CVPhienBanId { get; set; }
        public TrangThaiDonUngTuyen TrangThai { get; set; }
        public string GhiChu { get; set; }
        public System.DateTime? NgayUngTuyen { get; set; }
        // Thông tin tin tuyển dụng (join để FE khỏi N+1)
        public string TieuDe { get; set; }
        public string TenDoanhNghiep { get; set; }
        public string DiaDiemLamViec { get; set; }
        public decimal LuongToiThieu { get; set; }
        public decimal LuongToiDa { get; set; }
    }
}

