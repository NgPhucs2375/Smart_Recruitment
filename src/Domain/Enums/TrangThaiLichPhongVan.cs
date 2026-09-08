using Domain.Common;


namespace Domain.Enums
{
    public enum TrangThaiLichPhongVan
    {
        ChoXacNhan = 0, // HR vừa tạo lịch, chờ ứng viên phản hồi
        DaXacNhan = 1, // Ứng viên đã bấm đồng ý tham gia
        DaDoiLich = 2, // Ứng viên xin dời lịch hoặc HR chủ động đổi giờ hẹn
        DaHuy = 3, // Buổi phỏng vấn bị hủy
    }
}
