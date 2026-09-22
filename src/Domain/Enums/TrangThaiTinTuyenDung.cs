using Domain.Common;


namespace Domain.Enums
{
public enum TrangThaiTinTuyenDung
    {
        Nhap = 0,               // HR đang soạn thảo
        ChoDuyetHeThong = 1,    // Đang chạy qua Funnel (Regex & AI Agent)
        ChoAdminDuyet = 2,      // Tin rơi vào vùng nghi vấn (Vùng xám 30-85%), đẩy về Admin
        DangTuyen = 3,          // Đã công khai trên hệ thống
        TamDung = 4,            // HR chủ động tạm ngưng nhận đơn
        HetHan = 5,             // Background Job quét tự động đóng khi qua Deadline
        DaDong = 6,             // HR chủ động đóng tin khi tuyển đủ
        TuChoi = 7,             // Bị hệ thống / Admin từ chối phê duyệt
        BiKhoa = 8              // Admin cưỡng chế hạ tin khẩn cấp do vi phạm/report
    }
}
