namespace Domain.Enums
{
    public enum TrangThaiTienTrinhCV // cấp 2 : chi tiết hơn PhuongThucTaoCV
    {
        // --- Nhánh 1: Thủ công ---
        KhoiTaoMoi = 0,
        DangChinhSua = 1,

        // --- Nhánh 2: Upload trực tiếp ---
        DangTaiLenStorage = 2,
        KiemTraDinhDangVaVirus = 3,
        LoiTaiLen = 4,

        // --- Nhánh 3: AI Agent ---
        DangThuThapThongTin = 5, // Đang chat với Bot
        DangGoiModelTongHop = 6,  // Đang gọi LLM để build CV
        ChoUngVienKiemTraLai = 7, // AI gen xong, chờ user bấm duyệt
        LoiSinhDuLieuAI = 8,

        // --- Điểm hội tụ ---
        HoanTatTienTrinh = 9
    }
}