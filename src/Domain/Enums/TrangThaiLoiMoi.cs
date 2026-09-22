using Domain.Common;

namespace Domain.Enums
{
    public enum TrangThaiLoiMoi
    {
        ChoXacNhan = 1,   // Lời mời đã tạo và gửi email, token đang có hiệu lực
        DaChapNhan = 2,   // Nhân sự bấm chấp nhận và hoàn tất kích hoạt
        DaHuy = 3,        // Người đại diện chủ động thu hồi lời mời
        DaTuChoi = 4,     // Nhân sự nhận email và bấm từ chối tham gia
        HetHan = 5        // Token hết hạn sau thời gian quy định (NgayHetHan < DateTime.UtcNow)
    }
}
