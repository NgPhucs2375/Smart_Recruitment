namespace Domain.Enums
{
    public enum TriggerTinTuyenDung
    {
        GuiDuyet,               // HR nhấn gửi duyệt
        HeThongTuDongDuyet,     // Bộ lọc OK sau bước Người đại diện -> công khai
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
        AdminDuyetChoNguoiDaiDien,   // Legacy: không còn duyệt ngược thứ tự Admin -> Người đại diện
        NguoiDaiDienDuyet,      // Chủ doanh nghiệp duyệt tin Nhân sự
        NguoiDaiDienTuChoi,     // Chủ doanh nghiệp từ chối tin Nhân sự
        HeThongChuyenAdmin     // Bộ lọc phát hiện vi phạm/nghi vấn -> Admin duyệt tay
    }
}
