namespace Domain.Enums
{
    public enum TriggerDonUngTuyen
    {
        // --- 1. TÁC NHÂN: HỆ THỐNG / KỸ THUẬT (SYSTEM EVENTS) ---
        XuLyHoSoThanhCong = 0,   // File CV tải lên hợp lệ, parse/OCR dữ liệu thành công
        XuLyHoSoThatBai = 1,     // File CV lỗi, storage fail, không đọc được nội dung
        NopLaiHoSo = 2,          // Ứng viên gửi lại file sau khi gặp sự cố kỹ thuật
        HetHanXuLy = 3,          // Quá hạn SLA (Job quét tự động khi HR ngâm hồ sơ quá lâu)
        DongBoiTinTuyenDung = 4, // Tin tuyển dụng bị HR đóng, hết hạn hoặc Admin khóa

        // --- 2. TÁC NHÂN: NHÀ TUYỂN DỤNG / NHÂN SỰ (HR ACTIONS) ---
        XemDon = 5,             // HR nhấn mở xem chi tiết hồ sơ lần đầu
        DanhGiaPhuHop = 6,      // HR đánh giá hồ sơ đạt tiêu chí, mở cổng kết nối
        TuChoi = 7,             // HR từ chối hồ sơ (ở bất kỳ giai đoạn nào)

        // --- 3. TÁC NHÂN: ỨNG VIÊN (CANDIDATE ACTIONS) ---
        RutDon = 8              // Ứng viên chủ động rút đơn ứng tuyển
    }
}