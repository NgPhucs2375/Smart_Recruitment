using Domain.Common;


namespace Domain.Enums
{
    public enum TrangThaiTinTuyenDung
    {
        Nhap = 0, // biên soạn
        ChoDuyet = 1, // chờ duyệt từ AI hoặc Admin
        DaDuyet = 2, // đã được kiểm duyệt , sẵn sàng hiển thị (hoặc hẹn giờ đăng)
        DangTuyen = 3, // đã công khai
        TamDung = 4, // tạm dừng hiển thị và nhận hồ sơ mà không muốn xóa tin
        HetHan = 5, // Quá hạn nộp hồ sơ, lock ko nhận đơn
        DaDong = 6, // Nhân sự đống tin khi tuyển đủ
        TuChoi = 7 // Tin vi phạm quy chuẩn, từ khóa,....
    }
}
