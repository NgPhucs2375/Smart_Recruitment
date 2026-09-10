namespace Domain.Enums
{
    public enum TrangThaiPhanTichAgent
{
    DangPhanTich = 0, // Agent đang đọc CV và bóc tách
    HoanThanh = 1,    // Agent parse thành công ra JSON chuẩn
    ThatBai = 2       // Timeout, lỗi mạng hoặc prompt fail
}
}