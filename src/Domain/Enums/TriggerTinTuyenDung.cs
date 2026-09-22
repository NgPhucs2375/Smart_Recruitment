namespace Domain.Enums
{
    public enum TriggerTinTuyenDung
    {
        GuiDuyet,               // HR nhấn gửi duyệt
        HeThongTuDongDuyet,     // Pass từ khóa cấm + chấm điểm an toàn
        PhatHienNghiVan,        // Điểm vùng xám, cần người kiểm tra
        HeThongTuChoi,          // Dính Blacklist / Luật cứng ở Lớp 1
        AdminDuyet,             // Admin kiểm duyệt tay thành công
        AdminTuChoi,            // Admin từ chối tin
        TamDungTin,             // HR bấm tạm dừng
        MoLaiTin,               // HR kích hoạt lại tin
        HetHanNop,              // Job hệ thống kích hoạt
        DongTin,                // HR đóng tin tuyển đủ
        AdminCuongCheKhoa,      // Admin hạ tin vi phạm
        HeThongDuyetChoNguoiDaiDien, // Hệ thống pass tin của Nhân sự
        AdminDuyetChoNguoiDaiDien,   // Admin pass vùng xám của tin Nhân sự
        NguoiDaiDienDuyet,      // Chủ doanh nghiệp duyệt tin Nhân sự
        NguoiDaiDienTuChoi      // Chủ doanh nghiệp từ chối tin Nhân sự
    }
}
