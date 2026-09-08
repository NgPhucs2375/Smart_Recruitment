
namespace Domain.Enums
{
    public enum TrangThaiCV // cấp 3: core
    {
        DangXuLy = 0,   // Đang ở một trong các tiến trình tạo/sửa ở trên
        Loi = 1,        // Gặp sự cố kỹ thuật ở tiến trình tương ứng
        SanSang = 2,    // Đã hoàn tất, hợp lệ để nộp vào Tin tuyển dụng
        VoHieuHoa = 3   // Đã ẩn/xóa mềm
    }
}
