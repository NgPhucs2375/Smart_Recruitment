using Domain.Enums;

namespace Application.DTOs.DonUngTuyen
{
    public class CapNhatDonUngTuyenDto
    {
        public int Id { get; set; }

        /// <summary>
        /// Hành động cần thực hiện trên đơn (XemDon/DanhGiaPhuHop/TuChoi của HR,
        /// RutDon/NopLaiHoSo của ứng viên). KHÔNG dùng TrangThai ở đây: trạng thái
        /// là kết quả của transition, còn trigger mới là đầu vào của state machine.
        /// </summary>
        public TriggerDonUngTuyen Trigger { get; set; }

        public string GhiChu { get; set; }
    }
}