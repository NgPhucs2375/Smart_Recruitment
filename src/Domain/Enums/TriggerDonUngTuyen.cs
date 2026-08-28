

namespace Domain.Enums
{
    public enum TriggerDonUngTuyen
    {
        XemDon = 0, // NHAN_SU bấm xem lần đầu
        DanhGiaPhuHop=1, // NHAN_SU đánh giá là phù hợp
        TaoLichPhongVan=2, // NHAN_SU hẹn lịch PV
        CongBoTrungTuyen=3, // NHAN_SU thông báo trúng tuyển
        TuChoi=4, // NHAN_SU thông báo từ chối
        RutDonTruocPhongVan=5, // UNG_VIEN tự động rút đơn khi chua có lịch phỏng vấn
        RutDonSauPhongVan=6 // UNG_VIEN tự động rút đơn khi đã có lịch phỏng vấn
    }
}