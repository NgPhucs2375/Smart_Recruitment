namespace Domain.Enums
{
    public enum TrangThaiDonUngTuyen
    {
        // --- 1. TIẾP NHẬN & XỬ LÝ HỆ THỐNG ---
        KhoiTao = 0,          // Đang nhận request nộp đơn
        LoiXuLyHoSo = 1,      // BAD CASE: File CV hỏng, upload storage thất bại, parse lỗi
        ChoXuLy = 2,          // Đơn hợp lệ, đã vào hàng đợi chờ HR mở xem

        // --- 2. TƯƠNG TÁC TỪ PHÍA HR ---
        DaXem = 3,            // HR đã mở hồ sơ ra xem
        PhuHop = 4,           // HR đánh giá phù hợp (mở liên hệ/tiếp cận)
        TuChoi = 5,           // HR đánh giá không phù hợp

        // --- 3. BAD CASE VẬN HÀNH & VÒNG ĐỜI DỮ LIỆU ---
        UngVienRutDon = 6,   // Ứng viên chủ động hủy đơn
        QuaHanXuLy = 7,      // BAD CASE: Quá hạn N ngày HR không xem/không đánh giá (Expired)
        TinTuyenDungBiDong = 8, // BAD CASE: Tin đóng/hết hạn khi đơn chưa có kết quả
        VoHieuHoa = 9        // BAD CASE: Tài khoản ứng viên hoặc NTD bị khóa/gian lận
    }
}