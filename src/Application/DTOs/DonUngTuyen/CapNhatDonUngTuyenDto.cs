using Domain.Enums;

namespace Application.DTOs.DonUngTuyen
{
    public class CapNhatDonUngTuyenDto
    {
        public int Id { get; set; }

        public TrangThaiDonUngTuyen TrangThai { get; set; }

        public string GhiChu { get; set; }
    }
}