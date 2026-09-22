namespace Domain.Enums
{
    public enum TriggerTinTuyenDung
    {
        GuiDuyet,               // HR nhấn gửi duyệt
        HeThongTuDongDuyet,     // Pass Lớp 1 (Regex) + Lớp 2 (AI chấm an toàn)
        PhatHienNghiVan,        // Lớp 2 (AI) cắm cờ cần người kiểm tra
        HeThongTuChoi,          // Dính Blacklist / Luật cứng ở Lớp 1
        AdminDuyet,             // Admin kiểm duyệt tay thành công
        AdminTuChoi,            // Admin từ chối tin
        TamDungTin,             // HR bấm tạm dừng
        MoLaiTin,               // HR kích hoạt lại tin
        HetHanNop,              // Job hệ thống kích hoạt
        DongTin,                // HR đóng tin tuyển đủ
        AdminCuongCheKhoa       // Admin hạ tin vi phạm
    }
}